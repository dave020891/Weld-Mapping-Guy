// static/app.js

function obtenerRegistros() {
  return JSON.parse(localStorage.getItem('registros')) || [];
}

function extraerNombreDispositivo() {
  let ua = navigator.userAgent;
  let plataforma = navigator.platform;
  let dispositivo = "";

  if (/android/i.test(ua)) dispositivo = "Android";
  else if (/iPad|iPhone|iPod/.test(ua)) dispositivo = "iOS";
  else if (/Win/.test(plataforma)) dispositivo = "Windows PC";
  else if (/Mac/.test(plataforma)) dispositivo = "Mac";
  else dispositivo = "Other device";

  if (/Chrome/.test(ua)) dispositivo += " - Chrome";
  else if (/Safari/.test(ua)) dispositivo += " - Safari";
  else if (/Firefox/.test(ua)) dispositivo += " - Firefox";
  else dispositivo += " - Other browser";

  return dispositivo;
}

function guardar() {
  let registros = obtenerRegistros();

  const project       = document.getElementById('project_name').value;
  const line          = document.getElementById('line_number').value;
  const pipeSize      = document.getElementById('pipe_size').value;
  const pipeSCH       = document.getElementById('pipe_sch').value;
  const jointType     = document.getElementById('joint_type').value;
  const materialType  = document.getElementById('material_type').value;
  const weldId        = document.getElementById('weld_id').value;
  const stencil       = document.getElementById('stencil').value;
  const fabDate       = document.getElementById('fab_date').value;
  const htA           = document.getElementById('ht_a').value;
  const htB           = document.getElementById('ht_b').value;
  const comentario    = document.getElementById('comentario').value;
  const fotoA         = document.getElementById('foto_ht_a').files[0];
  const fotoB         = document.getElementById('foto_ht_b').files[0];
  const nombreGen     = extraerNombreDispositivo();

  if (!project || !line || !weldId || !stencil || !fabDate) {
    alert("Please fill out all required fields.");
    return;
  }

  const registro = {
    'Project Name': project,
    'Line Number':  line,
    'Pipe Size':    pipeSize,
    'Pipe SCH':     pipeSCH,
    'Joint Type':   jointType,
    'Material Type':materialType,
    'Weld ID':      weldId,
    'Stencil':      stencil,
    'Fabrication Date': new Date(fabDate).toLocaleDateString('en-US', {
      month: '2-digit',
      day:   '2-digit',
      year:  'numeric'
    }),
    'HT Side A':    htA,
    'HT Side B':    htB,
    'Comentario':   comentario,
    'Nombre Generador': nombreGen
  };

  registros.push(registro);
  localStorage.setItem('registros', JSON.stringify(registros));
  mostrarRegistro(registro);
  actualizarContador();

  const formData = new FormData();
  for (let key in registro) {
    formData.append(key, registro[key]);
  }

  if (fotoA && htA) {
    formData.append('foto_ht_a', new File([fotoA], htA + ".jpg", { type: fotoA.type }));
  }
  if (fotoB && htB) {
    formData.append('foto_ht_b', new File([fotoB], htB + ".jpg", { type: fotoB.type }));
  }

  fetch('/guardar', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(resp => {
      console.log("Record saved:", resp.mensaje);
    })
    .catch(err => {
      alert("Error saving to server.");
      console.error("Error saving to server:", err);
    });

  document.getElementById('weld_id').value = incrementarWeldID(weldId);
  ['stencil','ht_a','ht_b','comentario','foto_ht_a','foto_ht_b']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('ht_a').focus();
}

function incrementarWeldID(weldId) {
  let match = weldId.match(/(\D*)(\d+)$/);
  if (match) {
    let prefix = match[1];
    let number = parseInt(match[2], 10) + 1;
    return prefix + number.toString().padStart(match[2].length, '0');
  }
  return weldId;
}

function mostrarRegistro(registro) {
  const item = document.createElement('li');
  item.innerHTML = `
    ✅ <strong>${registro['Weld ID']}</strong> | ${registro['Stencil']} |
      Project: ${registro['Project Name']} | Line: ${registro['Line Number']}<br>
    HT A: ${registro['HT Side A']}<br>
    HT B: ${registro['HT Side B']}<br>
    Comment: ${registro['Comentario'] || '—'}
  `;
  document.getElementById('lista').appendChild(item);
}

function finalizarCaptura() {
  let registros = obtenerRegistros();
  if (registros.length === 0) {
    alert("You have no records to sync.");
    return;
  }

  const formData = new FormData();
  formData.append('registros', JSON.stringify(registros));

  fetch('/finalizar', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        document.getElementById('modal').style.display = 'flex';
        localStorage.removeItem('registros');
        document.getElementById('lista').innerHTML = '';
        actualizarContador();
      } else {
        alert("Error: " + data.mensaje);
      }
    })
    .catch(err => {
      alert("Error connecting to server.");
      console.error("Error connecting to server:", err);
    });
}

window.onclick = function(event) {
  const modal       = document.getElementById('modal');
  const closeButton = document.querySelector('.close-button');
  if (event.target === modal || event.target === closeButton) {
    modal.style.display = 'none';
  }
};

function actualizarContador() {
  document.getElementById('contador').textContent = obtenerRegistros().length;
}

window.onload = function() {
  obtenerRegistros().forEach(mostrarRegistro);
  actualizarContador();
  document.getElementById('nombre_generador').value = extraerNombreDispositivo();
};
