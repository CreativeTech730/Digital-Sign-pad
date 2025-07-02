const canvas = document.getElementById('signature-pad');
const penColorInput = document.getElementById('pen-color');
const penWidthInput = document.getElementById('pen-width');
let editingId = null;
let currentPage = 1;
const perPage = 5;  // Change How much records you want to show in single page
updatePenPreview();


const signaturePad = new SignaturePad(canvas, {
  penColor: penColorInput.value,
  minWidth: parseInt(penWidthInput.value) * 0.5,
  maxWidth: parseInt(penWidthInput.value)
});

function resizeCanvas() {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext('2d').scale(ratio, ratio);
  signaturePad.clear();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

penColorInput.addEventListener('change', () => {
  signaturePad.penColor = penColorInput.value;
  updatePenPreview();
});

penWidthInput.addEventListener('input', () => {
  const width = parseInt(penWidthInput.value);
  signaturePad.minWidth = width * 0.5;
  signaturePad.maxWidth = width;
  updatePenPreview();
});


function clearPad() {
  signaturePad.clear();
}

function savePad() {
  const dataURL = getCroppedSignatureDataURL();
  if (!dataURL) return; // stop if empty

  const name = document.getElementById('name').value.trim();
  if (!name) {
    showWarning("Please enter a name.");
    return;
  }

  if (editingId) {
    updateSignature(editingId);
  } else {
    fetch('/save-signature', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name, dataURL })
    })
    .then(res => res.json())
    .then(data => {
      showSuccess(data.message);
      signaturePad.clear();
      document.getElementById('name').value = '';
      loadSignatures();
    });
  }
}

function getCroppedSignatureDataURL() {
  if (signaturePad.isEmpty()) {
    showWarning("Please draw something first!");
    return null;
  }

  const data = signaturePad.toData();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  data.forEach(stroke => {
    stroke.points.forEach(point => {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });
  });

  const padding = 10;
  minX = Math.max(minX - padding, 0);
  minY = Math.max(minY - padding, 0);
  maxX = Math.min(maxX + padding, canvas.width);
  maxY = Math.min(maxY + padding, canvas.height);

  const width = maxX - minX;
  const height = maxY - minY;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = width;
  croppedCanvas.height = height;
  const ctx = croppedCanvas.getContext('2d');

  // ✅ Do NOT fill background → keep transparent
  ctx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);

  return croppedCanvas.toDataURL('image/png');
}


function downloadCroppedPad() {
  if (signaturePad.isEmpty()) {
    showWarning("Nothing to download. Please draw your signature first!");
    return;
  }

  // Get drawn paths
  const data = signaturePad.toData();

  // Find min/max points
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  data.forEach(stroke => {
    stroke.points.forEach(point => {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });
  });

  // Add some padding
  const padding = 10;
  minX = Math.max(minX - padding, 0);
  minY = Math.max(minY - padding, 0);
  maxX = Math.min(maxX + padding, canvas.width);
  maxY = Math.min(maxY + padding, canvas.height);

  const width = maxX - minX;
  const height = maxY - minY;

  // Create temp canvas
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = width;
  croppedCanvas.height = height;
  const ctx = croppedCanvas.getContext('2d');

  // Draw cropped part
  ctx.drawImage(
    canvas,
    minX, minY, width, height,
    0, 0, width, height
  );

  // Download
  const croppedDataURL = croppedCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = croppedDataURL;
  link.download = 'signature_cropped.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


document.getElementById('search-input').addEventListener('input', () => {
  currentPage = 1; // reset to first page
  loadSignatures();
});

function loadSignatures() {
  const searchValue = document.getElementById('search-input').value.trim().toLowerCase();
  fetch(`/get-signatures?page=${currentPage}&per_page=${perPage}&search=${encodeURIComponent(searchValue)}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('signatures');
      container.innerHTML = '';

      if (data.signatures.length === 0) {
        container.innerHTML = '<div class="text-muted">No signatures found.</div>';
      } else {
        data.signatures.forEach(sig => {
          const card = document.createElement('div');
          card.className = 'mb-3 p-2 border rounded';

          const img = document.createElement('img');
          img.src = `data:image/png;base64,${sig.data}`;
          img.className = 'mb-2';

          const title = document.createElement('div');
          title.innerHTML = `<strong>#${sig.id}</strong>: ${sig.name}`;

          const date = document.createElement('div');
          date.className = 'text-muted small';
          date.innerText = `Saved: ${new Date(sig.created_at).toLocaleString()}`;

          const actions = document.createElement('div');
          actions.className = 'action-icons';
          actions.innerHTML = `
            <i class="bi bi-pencil-square text-primary" title="Edit" onclick="editSignature(${sig.id})"></i>
            <i class="bi bi-save text-success" title="Update" onclick="updateSignature(${sig.id})"></i>
            <i class="bi bi-trash text-danger" title="Delete" onclick="deleteSignature(${sig.id})"></i>
            <a href="/download-signature/${sig.id}" download="signature_${sig.id}.png">
              <i class="bi bi-download text-secondary" title="Download"></i>
            </a>
          `;

          card.appendChild(img);
          card.appendChild(title);
          card.appendChild(date);
          card.appendChild(actions);
          container.appendChild(card);
        });
      }

      const totalPages = Math.ceil(data.total / perPage);
      document.getElementById('page-info').innerText = `Page ${currentPage} of ${totalPages}`;
      document.getElementById('prev-page').disabled = (currentPage <= 1);
      document.getElementById('next-page').disabled = (currentPage >= totalPages);
    });
}


document.getElementById('prev-page').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadSignatures();
  }
});

document.getElementById('next-page').addEventListener('click', () => {
  currentPage++;
  loadSignatures();
});


function editSignature(id) {
  fetch(`/get-signature/${id}`)
    .then(res => res.json())
    .then(sig => {
      editingId = id;
      document.getElementById('name').value = sig.name;
      signaturePad.fromDataURL(`data:image/png;base64,${sig.data}`);
    });
}

function updateSignature(id) {
  if (signaturePad.isEmpty()) {
    showWarning("Signature pad is empty!");
    return;
  }
  const name = document.getElementById('name').value.trim();
  if (!name) {
    showWarning("Please enter name.");
    return;
  }
  const dataURL = getCroppedSignatureDataURL()
  fetch(`/update-signature/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, dataURL })
  })
  .then(res => res.json())
  .then(data => {
    showSuccess(data.message);
    editingId = null;
    signaturePad.clear();
    document.getElementById('name').value = '';
    loadSignatures();
  });
}

function deleteSignature(id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "Do you want to delete this signature?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/delete-signature/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          showSuccess(data.message);
          loadSignatures();
        });
    }
  });
}

function updatePenPreview() {
  const preview = document.getElementById('pen-preview');
  const width = parseInt(penWidthInput.value);
  const color = penColorInput.value;
  preview.style.width = width * 2 + 'px';
  preview.style.height = width * 2 + 'px';
  preview.style.backgroundColor = color;
}

// dark toggle mode
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('darkModeToggle');
  toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', toggle.checked);
  });
});

function showSuccess(msg) {
  Swal.fire({
    icon: 'success',
    title: 'Success',
    text: msg,
    confirmButtonColor: '#0d6efd'
  });
}

function showError(msg) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: msg,
    confirmButtonColor: '#dc3545'
  });
}

function showWarning(msg) {
  Swal.fire({
    icon: 'warning',
    title: 'Warning',
    text: msg,
    confirmButtonColor: '#ffc107'
  });
}