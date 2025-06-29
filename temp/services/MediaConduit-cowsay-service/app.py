from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.route('/cowsay', methods=['POST'])
def cowsay():
    data = request.get_json()
    text = data.get('text', 'Moo!')
    
    try:
        result = subprocess.run(['cowsay', text], capture_output=True, text=True, check=True)
        return jsonify({'cowsayOutput': result.stdout})
    except subprocess.CalledProcessError as e:
        return jsonify({'error': e.stderr}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
