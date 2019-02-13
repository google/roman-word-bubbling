"""
    Copyright 2018 Google LLC

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        https://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.from PIL import Image
"""

from flask import Flask, request, send_file
from io import BytesIO

app = Flask(__name__)


@app.route('/dG9tbXltYWx2ZWVrYXJ3Yg', methods=['GET', 'POST'])
def flip_word():
  # TODO: This should actually run the opencv code to do the bubbling. Figure
  # out how to get this into App Engine (get numpy working and get OpenCV .so
  # files small enough to be under App Engine's limit)
  img = Image.open(BytesIO(request.data))
  img = img.rotate(180)
  output = BytesIO()
  img.save(output, 'png')
  output.seek(0)

  return send_file(output,
                   attachment_filename='bubbled.png',
                   mimetype='image/png')

if __name__ == '__main__':
  # This is used when running locally only. When deploying to Google App
  # Engine, a webserver process such as Gunicorn will serve the app. This
  # can be configured by adding an `entrypoint` to app.yaml.
  # Flask's development server will automatically serve static files in
  # the "static" directory. See:
  # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
  # App Engine itself will serve those files as configured in app.yaml.
  app.run(host='127.0.0.1', port=8080, debug=True)
