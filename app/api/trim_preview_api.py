import os
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/trim', methods=['POST'])
def handle_trim():
    data = request.json
    input_path = data['input_path']
    start_time = data['start_time']
    end_time = data['end_time']
    output_path = os.path.join('C:\projects\Morphix\data\renders', f'trim_{os.path.basename(input_path)}')
    
    cmd = ["ffmpeg", ".-i", input_path,
            "-ss", start_time,
            "-to", end_time,
            "-c:v", "copy",
            "-c:a", "copy",
            output_path]
    
    try:
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return jsonify({"status": "success", "output_path": output_path})
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "message": e.stderr.decode()})

@app.route('/preview', methods=['POST'])
def handle_preview():
    data = request.json
    input_path = data['input_path']
    preview_time = data['preview_time']
    output_path = os.path.join('C:\projects\Morphix\data\renders', "preview_snippet.webm")
    
    cmd = ["ffmpeg", ".-i", input_path,
            "-ss", preview_time,
            "-t", "00:00:01",
            "-c:v", "libvpx",
            "-b:v", "1M",
            "-c:a", "libvorbis",
            output_path]
    
    try:
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return jsonify({"status": "success", "preview_path": output_path})
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "message": e.stderr.decode()})

if __name__ == '__main__':
    app.run(debug=True)