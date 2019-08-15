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

from flask import Flask, request
from io import BytesIO
from google.appengine.api import mail

app = Flask(__name__)

@app.route('/dG9tbXltYWx2ZWVrYXJ3Yg.html', methods=['GET', 'POST'])
def send_feedback():
  if request.method == "POST":
    data = request.get_json()
    message = mail.EmailMessage(sender="romanwordbubbling@gmail.com",
                   to="romanwordbubbling@gmail.com",
                   subject=data['title'],
                   body=data['description'])
    message.send()
    return """<html><body>Feedback received</body></html>"""
  else:
    return """<html><body>Unknown error occurred</body></html>"""  

if __name__ == '__main__':
  # This is used when running locally only. When deploying to Google App
  # Engine, a webserver process such as Gunicorn will serve the app. This
  # can be configured by adding an `entrypoint` to app.yaml.
  # Flask's development server will automatically serve static files in
  # the "static" directory. See:
  # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
  # App Engine itself will serve those files as configured in app.yaml.
  app.run(host='127.0.0.1', port=8080, debug=True)
