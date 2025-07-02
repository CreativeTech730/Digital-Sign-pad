# Digital Signature Pad

A web application to draw, save, view, update, and delete digital signatures. Built with Flask (Python), SQLite, Bootstrap, and JavaScript.

---

## 🚀 How to Use

### 1. **Clone the Repository**
```sh
git clone https://github.com/CreativeTech730/Digital-Sign-pad.git
cd Digital-Sign-pad
```

### 2. **Install Dependencies**
```sh
pip install -r requirements.txt
```

### 3. **Run the Application (Development)**
```sh
python app.py
```
- Visit [http://localhost:10000](http://localhost:10000) in your browser.

### 4. **Production Deployment**
- Use [Render](https://render.com) or any Linux server.
- Render will use `gunicorn` as specified in `render.yml`:
  ```
  gunicorn app:app
  ```

---

## 📝 Application Flow

1. **Home Page**  
   - Draw your signature on the canvas.
   - Enter your name and save the signature.

2. **Saved Signatures**  
   - View a paginated list of saved signatures.
   - Search signatures by name.
   - Download, update, or delete any signature.

3. **Database**  
   - Uses SQLite (`signatures.db`) to store signatures as binary blobs with metadata.

---

## 🛠️ Developer Notes

- **Structure:**
  - `app.py` — Main Flask backend.
  - `templates/index.html` — Main HTML template.
  - `static/` — JS and CSS files.

- **Endpoints:**
  - `/` — Main page.
  - `/save-signature` — Save a new signature (POST).
  - `/get-signatures` — Get paginated signatures (GET).
  - `/download-signature/<id>` — Download a signature as PNG.
  - `/get-signature/<id>` — Get a single signature (GET).
  - `/update-signature/<id>` — Update a signature (POST).
  - `/delete-signature/<id>` — Delete a signature (DELETE).

- **Database:**
  - SQLite is used for demo/testing. For production, consider PostgreSQL.

- **Customization:**
  - To change the database, update the connection logic in `app.py`.
  - To alter the UI, edit `templates/index.html` and files in `static/`.

- **Production Note:**
  - On platforms like Render, SQLite data is not persistent. Use a managed database for production.

---

## ✏️ How to Extend

- Add user authentication for private signature storage.
- Integrate with cloud storage for persistent signature files.
- Add more export formats (PDF, SVG).
- Improve UI/UX with more drawing tools.

---

## 📄 License

MIT License

---