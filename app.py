from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os
import pandas as pd
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'excel_generados'
app.config['IMAGE_FOLDER'] = 'imagenes_soldaduras'

registros = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/guardar', methods=['POST'])
def guardar():
    data = request.form
    files = request.files

    registro = {
        'Project Name': data.get('Project Name'),
        'Line Number': data.get('Line Number'),
        'Pipe Size': data.get('Pipe Size'),
        'Pipe SCH': data.get('Pipe SCH'),
        'Joint Type': data.get('Joint Type'),
        'Material Type': data.get('Material Type'),
        'Weld ID': data.get('Weld ID'),
        'Stencil': data.get('Stencil'),
        'Fabrication Date': data.get('Fabrication Date'),
        'HT Side A': data.get('HT Side A'),
        'HT Side B': data.get('HT Side B'),
        'Comentarios': data.get('Comentario'),
        'Nombre Generador': data.get('Nombre Generador'),
        'Fecha Registro': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

    registros.append(registro)

    fecha_folder = datetime.now().strftime('%Y-%m-%d')
    ruta_guardado = os.path.join(app.config['UPLOAD_FOLDER'], fecha_folder)
    ruta_fotos = os.path.join(app.config['IMAGE_FOLDER'], fecha_folder)
    os.makedirs(ruta_guardado, exist_ok=True)
    os.makedirs(ruta_fotos, exist_ok=True)

    # Guardar imágenes con nombre original del archivo
    for key in files:
        file = files[key]
        if file and file.filename:
            filename = secure_filename(file.filename)
            file.save(os.path.join(ruta_fotos, filename))

    return jsonify({"mensaje": "Registro guardado exitosamente."})

@app.route('/finalizar', methods=['POST'])
def finalizar():
    try:
        registros_recibidos = request.form.get('registros')
        if not registros_recibidos:
            return jsonify({"mensaje": "No hay registros para guardar."}), 400

        registros_cargados = eval(registros_recibidos)
        if not isinstance(registros_cargados, list) or not registros_cargados:
            return jsonify({"mensaje": "El formato de los registros no es válido."}), 400

        df = pd.DataFrame(registros_cargados)
        fecha_actual = datetime.now().strftime('%Y-%m-%d')
        hora_actual = datetime.now().strftime('%H-%M-%S')
        nombre_archivo = f"registro_{fecha_actual}_{hora_actual}.xlsx"

        ruta_guardado = os.path.join(app.config['UPLOAD_FOLDER'], fecha_actual)
        os.makedirs(ruta_guardado, exist_ok=True)
        ruta_completa = os.path.join(ruta_guardado, nombre_archivo)

        df.to_excel(ruta_completa, index=False)

        return jsonify({"mensaje": "Excel generado correctamente.", "status": "success"})
    except Exception as e:
        return jsonify({"mensaje": f"Error al generar Excel: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
