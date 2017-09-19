'use strict';

const functions = require('firebase-functions');
const mkdirp = require('mkdirp-promise');
// Include a Service Account Key to use a Signed URL
const gcs = require('@google-cloud/storage')({ keyFilename: 'service-account-credentials.json' });
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

// Max height and width of the thumbnail in pixels.
const THUMB_MAX_HEIGHT = 40;
const THUMB_MAX_WIDTH = 40;
// Thumbnail prefix added to file names.
const THUMB_PREFIX = 'thumb_';

const DATABASE_TRIGGER_PATH = '/notes/{pushId}/imageURL';
const DATABASE_IMAGE_PATH = '/images';

function getFilename(url) {
  if (url) {
    const begin = url.indexOf(DATABASE_IMAGE_PATH); // .../images%2f or .../images/
    const end = url.indexOf('?alt=');
    if (begin > -1 && end > -1) {
      const skip = url[begin + 7] === '%' ? 10 : 8;
      return url.slice(begin + skip, end);
    } else {
      return url;
    }
  }
  return null;
}

exports.makeThumb = functions.database.ref(DATABASE_TRIGGER_PATH).onWrite(event => {
  const current = event.data.val(); // ''(empty) when no image
  const previous = event.data.previous.val(); // null if non-exitent
  const currentFile = getFilename(current);
  const previousFile = getFilename(previous);
  const changed = event.data.changed(); // always true

  const toMake = !!current; // can check if thumb already exists then skip generation?
  const toDelete = !!previous; // be cautious when deleting a thumb file as it can be used in elsewhere

  //console.log(`makeThumb(${event.params.pushId}, ${current}, ${event.data.ref.parent.child('text').val})`);
  //console.log(`makeThumb(${event.params.pushId}, ${previousFile} => ${currentFile}, ${toMake}, ${toDelete})`);

  if (!toMake) {
    return;
  }

  //const bucket = event.data.child('bucket').val();
  //const bucket = gcs.bucket(functions.config().firebase.bucket);
  //const bucket = functions.config().firebase.bucket;
  //const bucket = gcs.bucket('ng-notes-abb75.appspot.com');
  //const filename = currentFile;//event.data.child('filename').val();
  const bucketName = functions.config().firebase.storageBucket;
  const bucket = gcs.bucket(bucketName);

  const filePath = 'images/' + currentFile;
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath);

  const thumbFilePath = path.normalize(path.join(fileDir, `${THUMB_PREFIX}${fileName}`));
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const tempLocalThumbFile = path.join(os.tmpdir(), thumbFilePath);

  // // Exit if this is triggered on a file that is not an image.
  // if (!event.data.contentType.startsWith('image/')) {
  //   console.log('This is not an image.');
  //   return;
  // }

  // Exit if the image is already a thumbnail.
  // if (fileName.startsWith(THUMB_PREFIX)) {
  //   console.log('Already a Thumbnail.');
  //   return;
  // }
  // Exit if the image is already a thumbnail.
  // if (fileName.startsWith(THUMB_PREFIX)) {
  //   console.log('Already a Thumbnail.');
  //   return;
  // }

  // // Exit if this is a move or deletion event.
  // if (event.data.resourceState === 'not_exists') {
  //   console.log('This is a deletion event.');
  //   return;
  // }

  // Cloud Storage files.
  //const bucket = gcs.bucket(event.data.bucket);
  const file = bucket.file(filePath);
  const thumbFile = bucket.file(thumbFilePath);

  //thumbFile.getFilename()

  // Create the temp directory where the storage file will be downloaded.
  return mkdirp(tempLocalDir).then(() => {
    // Download file from bucket.
    return file.download({ destination: tempLocalFile });
  }).then(() => {
    //console.log('The file has been downloaded to', tempLocalFile);
    // Generate a thumbnail using ImageMagick.
    return spawn('convert', [tempLocalFile, '-thumbnail', `${THUMB_MAX_WIDTH}x${THUMB_MAX_HEIGHT}>`, tempLocalThumbFile]);
  }).then(() => {
    //console.log('Thumbnail created at', tempLocalThumbFile);
    // Uploading the Thumbnail.
    return bucket.upload(tempLocalThumbFile, { destination: thumbFilePath });
  }).then(() => {
    //console.log('Thumbnail uploaded to Storage at', thumbFilePath);
    // Once the image has been uploaded delete the local files to free up disk space.
    fs.unlinkSync(tempLocalFile);
    fs.unlinkSync(tempLocalThumbFile);
    // Get the Signed URLs for the thumbnail and original image.
    const config = {
      action: 'read',
      expires: '03-01-2500'
    };
    return Promise.all([
      thumbFile.getSignedUrl(config),
      file.getSignedUrl(config)
    ]);
  }).then(results => {
    console.log('Got Signed URLs.');
    const thumbResult = results[0];
    const originalResult = results[1];
    const thumbFileUrl = thumbResult[0];
    const fileUrl = originalResult[0];
    // Add the URLs to the Database
    return event.data.ref.parent.child('thumbURL').set(thumbFileUrl);

    //return admin.database().ref('images').push({ path: fileUrl, thumbnail: thumbFileUrl });
  });

});

// test for joanne-lee
const CONVERT_PREFIX = 'of_'; // image2 file would have this prefix, e.g. 'of_Sarah.jpeg.png', to delete after conversion

exports.recordUrl = functions.storage.object().onChange(event => {
  // File and directory paths.
  const filePath = event.data.name; // 'illustration/Sarah.jpeg'
  const fileDir = path.dirname(filePath); // 'illustration'
  const fileName = path.basename(filePath); // e.g. 'Sarah.jpeg' or 'of_Sarah.jpeg.png'
  //const folder = filePath.split('/').slice(0).join();
  const fileExt = fileName.split('.').splice(-1).join().toLowerCase();
  const toConvert = fileName.startsWith(CONVERT_PREFIX);
  const isThumb = fileName.startsWith(THUMB_PREFIX);

  //console.log(`filePath: ${filePath}, ${fileDir}, ${folder}`);

  // Exit if this is triggered on a file that is not an image.
  if (!event.data.contentType.startsWith('image/')) {
    //console.log('This is not an image.');
    return;
  }

  // Exit if this is a move or deletion event.
  if (event.data.resourceState === 'not_exists') {
    //console.log('This is a deletion event.');
    return;
  }

  if (isThumb) {
    //console.log('This is thumb.');
    return;
  }

  // Cloud Storage files.
  const bucket = gcs.bucket(event.data.bucket);
  const file = bucket.file(filePath);

  // Get the Signed URLs for the thumbnail and original image.
  const config = {
    action: 'read',
    expires: '03-01-2500'
  };

  if (!toConvert) { // image 1 uploaded, record its url and return
    return file.getSignedUrl(config, function (err, url) {
      admin.database().ref(fileDir).push({ fileName: fileName, url: url })
        .then(_ => console.log(`recorded url of '${fileName}' ok`));
    });
  }

  // image 2 uploaded, convert to thumb, record its url in database.thumbUrl

  const originalName = fileName.split('.').slice(0, -1).join('.').replace(CONVERT_PREFIX, ''); // get 'Sarah.jpeg' from 'of_Sarah.jpeg.png'

  const thumbFilePath = path.normalize(path.join(fileDir, `${THUMB_PREFIX}${fileName}`));
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const tempLocalThumbFile = path.join(os.tmpdir(), thumbFilePath);

  const thumbFile = bucket.file(thumbFilePath);

  // Create the temp directory where the storage file will be downloaded.
  return mkdirp(tempLocalDir).then(() => {
    // Download file from bucket.
    return file.download({ destination: tempLocalFile });
  }).then(() => {
    //console.log('The file has been downloaded to', tempLocalFile);
    // Generate a thumbnail using ImageMagick.
    return spawn('convert', [tempLocalFile, '-thumbnail', `${THUMB_MAX_WIDTH}x${THUMB_MAX_HEIGHT}>`, tempLocalThumbFile]);
  }).then(() => {
    //console.log('Thumbnail created at', tempLocalThumbFile);
    // Uploading the Thumbnail.
    return bucket.upload(tempLocalThumbFile, { destination: thumbFilePath });
  }).then(() => {
    //console.log('Thumbnail uploaded to Storage at', thumbFilePath);
    // Once the image has been uploaded delete the local files to free up disk space.
    fs.unlinkSync(tempLocalFile);
    fs.unlinkSync(tempLocalThumbFile);

    // Get the Signed URLs for the thumbnail and original image.
    return Promise.all([
      thumbFile.getSignedUrl(config),
    ]);
  }).then(results => {
    const originalResult = results[0];
    const fileUrl = originalResult[0];
    console.log(`got signed URL of thumb, looking for '${originalName}' in database`);

    // Add the URLs to the Database
    let key;
    return admin.database().ref(fileDir)
      .orderByChild('fileName')
      .equalTo(originalName)
      .once('value')
      .then(snap => {
        snap.forEach(i => {
          //console.log(`found key(${i.key})`);
          if (i.key) {
            key = i.key;
          }
        });

        if (key && fileUrl) {
          return admin.database().ref(`/${fileDir}/${key}`).update({ 'thumbUrl': fileUrl });
        } else {
          return Promise.reject(`couldn't find '${originalName}' in database`);
        }
      });

  }).then(_ => file.delete())
    .then(_ => console.log(`removed file '${fileName}' ok`))
    .catch(error => console.error('image2', error));

});
/**
 * When an image is uploaded in the Storage bucket We generate a thumbnail automatically using
 * ImageMagick.
 * After the thumbnail has been generated and uploaded to Cloud Storage,
 * we write the public URL to the Firebase Realtime Database.
 */
/*
exports.generateThumbnail = functions.storage.object().onChange(event => {
  // File and directory paths.
  const filePath = event.data.name;
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const thumbFilePath = path.normalize(path.join(fileDir, `${THUMB_PREFIX}${fileName}`));
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const tempLocalThumbFile = path.join(os.tmpdir(), thumbFilePath);

  // Exit if this is triggered on a file that is not an image.
  if (!event.data.contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return;
  }

  // Exit if the image is already a thumbnail.
  if (fileName.startsWith(THUMB_PREFIX)) {
    console.log('Already a Thumbnail.');
    return;
  }

  // Exit if this is a move or deletion event.
  if (event.data.resourceState === 'not_exists') {
    console.log('This is a deletion event.');
    return;
  }

  // Cloud Storage files.
  const bucket = gcs.bucket(event.data.bucket);
  const file = bucket.file(filePath);
  const thumbFile = bucket.file(thumbFilePath);

  // Create the temp directory where the storage file will be downloaded.
  return mkdirp(tempLocalDir).then(() => {
    // Download file from bucket.
    return file.download({destination: tempLocalFile});
  }).then(() => {
    console.log('The file has been downloaded to', tempLocalFile);
    // Generate a thumbnail using ImageMagick.
    return spawn('convert', [tempLocalFile, '-thumbnail', `${THUMB_MAX_WIDTH}x${THUMB_MAX_HEIGHT}>`, tempLocalThumbFile]);
  }).then(() => {
    console.log('Thumbnail created at', tempLocalThumbFile);
    // Uploading the Thumbnail.
    return bucket.upload(tempLocalThumbFile, {destination: thumbFilePath});
  }).then(() => {
    console.log('Thumbnail uploaded to Storage at', thumbFilePath);
    // Once the image has been uploaded delete the local files to free up disk space.
    fs.unlinkSync(tempLocalFile);
    fs.unlinkSync(tempLocalThumbFile);
    // Get the Signed URLs for the thumbnail and original image.
    const config = {
      action: 'read',
      expires: '03-01-2500'
    };
    return Promise.all([
      thumbFile.getSignedUrl(config),
      file.getSignedUrl(config)
    ]);
  }).then(results => {
    console.log('Got Signed URLs.');
    const thumbResult = results[0];
    const originalResult = results[1];
    const thumbFileUrl = thumbResult[0];
    const fileUrl = originalResult[0];
    // Add the URLs to the Database
    return admin.database().ref('images').push({path: fileUrl, thumbnail: thumbFileUrl});
  });
});
*/
/*
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  admin.database().ref('/messages').push({original: original}).then(snapshot => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    res.redirect(303, snapshot.ref);
  });
});

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      console.log('Uppercasing', event.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return event.data.ref.parent.child('uppercase').set(uppercase);
    });
*/