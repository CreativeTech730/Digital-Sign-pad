from flask import Flask, request, jsonify, send_file, render_template
import sqlite3
import base64
import io

app = Flask(__name__)

def init_db():
    with sqlite3.connect('signatures.db') as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS signatures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                signature BLOB,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save-signature', methods=['POST'])
def save_signature():
    data = request.get_json()
    name = data['name']
    data_url = data['dataURL']
    _, encoded = data_url.split(",", 1)
    binary_data = base64.b64decode(encoded)

    with sqlite3.connect('signatures.db') as conn:
        conn.execute('''
            INSERT INTO signatures (name, signature, created_at)
            VALUES (?, ?, datetime('now'))
        ''', (name, binary_data))
        conn.commit()

    return jsonify({'message': 'Signature saved!'})


@app.route('/get-signatures')
def get_signatures():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 5))
    search = request.args.get('search', '').strip().lower()

    offset = (page - 1) * per_page

    with sqlite3.connect('signatures.db') as conn:
        conn.row_factory = sqlite3.Row
        if search:
            # Count matching
            total = conn.execute(
                "SELECT COUNT(*) FROM signatures WHERE LOWER(name) LIKE ?", 
                (f'%{search}%',)
            ).fetchone()[0]

            # Fetch matching, ordered & paged
            rows = conn.execute(
                '''
                SELECT id, name, signature, created_at
                FROM signatures
                WHERE LOWER(name) LIKE ?
                ORDER BY datetime(created_at) DESC
                LIMIT ? OFFSET ?
                ''', 
                (f'%{search}%', per_page, offset)
            ).fetchall()
        else:
            # Count all
            total = conn.execute('SELECT COUNT(*) FROM signatures').fetchone()[0]
            # Fetch all
            rows = conn.execute(
                '''
                SELECT id, name, signature, created_at
                FROM signatures
                ORDER BY datetime(created_at) DESC
                LIMIT ? OFFSET ?
                ''', 
                (per_page, offset)
            ).fetchall()

    signatures = []
    for row in rows:
        b64 = base64.b64encode(row['signature']).decode('utf-8')
        signatures.append({
            'id': row['id'],
            'name': row['name'],
            'data': b64,
            'created_at': row['created_at']
        })

    return jsonify({'signatures': signatures, 'total': total})



@app.route('/download-signature/<int:sig_id>')
def download_signature(sig_id):
    with sqlite3.connect('signatures.db') as conn:
        row = conn.execute('SELECT signature FROM signatures WHERE id=?', (sig_id,)).fetchone()
    if row:
        blob = row[0]
        return send_file(io.BytesIO(blob), mimetype='image/png', as_attachment=True,
                         download_name=f'signature_{sig_id}.png')
    else:
        return "Not found", 404

@app.route('/get-signature/<int:sig_id>')
def get_signature(sig_id):
    with sqlite3.connect('signatures.db') as conn:
        row = conn.execute('SELECT id, name, signature FROM signatures WHERE id=?', (sig_id,)).fetchone()
    if row:
        id, name, blob = row
        b64 = base64.b64encode(blob).decode('utf-8')
        return jsonify({'id': id, 'name': name, 'data': b64})
    else:
        return jsonify({'error': 'Not found'}), 404

@app.route('/update-signature/<int:sig_id>', methods=['POST'])
def update_signature(sig_id):
    data = request.get_json()
    name = data.get('name')
    data_url = data.get('dataURL')
    _, encoded = data_url.split(",", 1)
    binary_data = base64.b64decode(encoded)

    with sqlite3.connect('signatures.db') as conn:
        conn.execute('UPDATE signatures SET name=?, signature=? WHERE id=?', (name, binary_data, sig_id))
        conn.commit()

    return jsonify({'message': 'Signature updated!'})

@app.route('/delete-signature/<int:sig_id>', methods=['DELETE'])
def delete_signature(sig_id):
    with sqlite3.connect('signatures.db') as conn:
        conn.execute('DELETE FROM signatures WHERE id=?', (sig_id,))
        conn.commit()

    return jsonify({'message': 'Signature deleted!'})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=10000)
