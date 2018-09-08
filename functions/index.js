'use strict';

const functions = require('firebase-functions');
const mkdirp = require('mkdirp-promise');
// Include a Service Account Key to use a Signed URL
const gcs = require('@google-cloud/storage')({
  keyFilename: 'service-account-credentials.json',
  projectId: 'ng-notes-abb75'
});
const admin = require('firebase-admin');
admin.initializeApp();

const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

// Max height and width of the thumbnail in pixels.
const THUMB_MAX_HEIGHT = 40;
const THUMB_MAX_WIDTH = 40;
// Thumbnail prefix added to file names.
const THUMB_PREFIX = 'thumb_';

const RTDB_TRIGGER_PATH = '/notes/{pushId}/imageURL';
const FIRESTORE_TRIGGER_PATH = '/notes/{group}/notes/{key}';

const STORAGE_IMAGE_FOLDER = 'images';
const STORAGE_VIDEO_FOLDER = 'videos';

const IMAGE_MAX_HEIGHT = 800;
const IMAGE_MAX_BYTES = 500000; // resize if greater than 500kb
const RESIZED_IMAGE_PREFIX = 'resized_';

function getFilename(url) { // returns 'Sarah.jpg' or 'bunny.mp4'
  if (url) {
    const downloadUrl = url.indexOf('firebasestorage.googleapis.com'); // or signedUrl with 'storage.googleapis.com'
    const END_MATCHER = downloadUrl > -1 ? '?alt=' : '?GoogleAccessId=';
    let begin = url.indexOf(`/${STORAGE_IMAGE_FOLDER}`); // .../images%2f or .../images/
    if (begin === -1) begin = url.indexOf(`/${STORAGE_VIDEO_FOLDER}`); // .../videos%2f or .../videos/
    const end = url.indexOf(END_MATCHER);
    //console.log(`getFilename(${downloadUrl},${END_MATCHER},${begin},${end})`)
    if (begin > -1 && end > -1) {
      const skip = url[begin + 7] === '%' ? 10 : 8;
      return url.slice(begin + skip, end);
    } else {
      //return url;
      throw `getFilename() got invalid url: ${url}`;
    }
  }
  return null;
}

function getFilepath(url) { // returns 'images/Sarah.jpg' or 'videos/bunny.mp4'
  if (url) {
    const downloadUrl = url.indexOf('firebasestorage.googleapis.com');
    const END_MATCHER = downloadUrl > -1 ? '?alt=' : '?GoogleAccessId=';
    let begin = url.indexOf(`/${STORAGE_IMAGE_FOLDER}`);
    let folder = STORAGE_IMAGE_FOLDER;
    if (begin === -1) {
      begin = url.indexOf(`/${STORAGE_VIDEO_FOLDER}`);
      folder = STORAGE_VIDEO_FOLDER;
    }
    const end = url.indexOf(END_MATCHER);

    if (begin > -1 && end > -1) {
      const skip = url[begin + 7] === '%' ? 10 : 8;
      return `${folder}/${url.slice(begin + skip, end)}`;
    } else {
      throw `getFilepath() got invalid url: ${url}`;
    }
  }
  return null;
}

function deleteImage(url) {
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  const bucketName = /*functions.config().firebase*/firebaseConfig.storageBucket;
  const bucket = gcs.bucket(bucketName);

  const filePath = getFilepath(url);
  const file = bucket.file(filePath);

  return file.delete().then(data => {
    console.log('image deleted:', filePath);
  });
}

function getSize(file) {
  return file.getMetadata().then(data => {
    const metadata = data[0];
    return metadata.size;
  });
}

exports.handleImage = functions.firestore.document(FIRESTORE_TRIGGER_PATH).onWrite((change, context) => {
  //console.log(`handleImage(${context.params.group}, ${context.params.key})`);
  try {
    var current = change.after.data();
  } catch (e) {
    console.log('current document null');
  }
  try {
    var previous = change.before.data();
  } catch (e) {
    console.log('previous document null');
  }

  if (!current) {
    if (previous && previous.imageURL) { // note with image deleted
      return deleteImage(previous.imageURL);
    } else {
      return 'current document null';
    }
  }

  if (!current.imageURL) {
    if (previous && previous.imageURL) { // note imageURL deleted
      return deleteImage(previous.imageURL);
    } else {
      return 'current imageURL null';
    }
  }

  const currentFile = getFilename(current.imageURL); // e.g. 'Sarah.jpg'

  if (currentFile.startsWith(RESIZED_IMAGE_PREFIX)) {
    return 'Already resized';
  }

  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  const bucketName = firebaseConfig.storageBucket;
  const bucket = gcs.bucket(bucketName);

  const filePath = getFilepath(current.imageURL);
  console.log('getFilepath', filePath);

  if (filePath.startsWith(STORAGE_VIDEO_FOLDER)) {
    if (previous && previous.imageURL) { // note image changed, to delete previous image
      return deleteImage(previous.imageURL);
    } else {
      return 'video file';
    }
  }

  // got image file, resize it when possible, replace in storage and update url in database
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath);

  const thumbFilePath = path.normalize(path.join(fileDir, 
    `${RESIZED_IMAGE_PREFIX}${IMAGE_MAX_HEIGHT}_${fileName}`));

  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const tempLocalThumbFile = path.join(os.tmpdir(), thumbFilePath);

  const file = bucket.file(filePath);
  const thumbFile = bucket.file(thumbFilePath);

  return getSize(file).then(size => {

    if (size < IMAGE_MAX_BYTES) {
      console.log('image file small enough, ', size, 'bytes');
      return 'image file small enough';
    }
    console.log(`image: ${currentFile}, ${size} bytes`);

    return mkdirp(tempLocalDir).then(() => {
      return file.download({ destination: tempLocalFile });
    }).then(() => {
      return spawn('convert', [tempLocalFile, '-resize', `${IMAGE_MAX_HEIGHT}x${IMAGE_MAX_HEIGHT}>`, tempLocalThumbFile]);
    }).then(() => {
      return bucket.upload(tempLocalThumbFile, { destination: thumbFilePath });
    }).then(() => {
      console.log('Resized as:', thumbFilePath);
      // Once the image has been uploaded delete the local files to free up disk space.
      fs.unlinkSync(tempLocalFile);
      fs.unlinkSync(tempLocalThumbFile);
      // Get the Signed URL for the resized image
      const config = {
        action: 'read',
        expires: '03-01-2500'
      };
      return Promise.all([
        thumbFile.getSignedUrl(config),
      ]);
    }).then(results => {
      const thumbResult = results[0];
      const thumbFileUrl = thumbResult[0];

      return change.after.ref.set({
        imageURL: thumbFileUrl
      }, { merge: true });
    }).then(result => {
      //console.log('database.imageURL updated');
      // delete original file in storage
      return file.delete();
    }).then(result => {
      //console.log('original image deleted from storage');
      if (previous && previous.imageURL) { // note image changed, to delete previous image
        return deleteImage(previous.imageURL);
      }
    }).catch(error => console.log('Error in handleImage(): ', error));

  });
});

exports.makeThumb = functions.database.ref(RTDB_TRIGGER_PATH).onWrite((change, context) => {
  const current = change.after.val(); // ''(empty) when no image
  const currentFile = getFilename(current);

  const toMake = !!current; // can check if thumb already exists then skip generation?

  //console.log(`makeThumb(${event.params.pushId}, ${current}, ${event.data.ref.parent.child('text').val})`);
  //console.log(`makeThumb(${event.params.pushId}, ${previousFile} => ${currentFile}, ${toMake}, ${toDelete})`);

  if (!toMake) {
    return;
  }

  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  const bucketName = firebaseConfig.storageBucket;
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

  // // Exit if this is a move or deletion event.
  // if (event.data.resourceState === 'not_exists') {
  //   console.log('This is a deletion event.');
  //   return;
  // }

  // Cloud Storage files.
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
    //const fileUrl = originalResult[0];
    // Add the URLs to the Database
    return change.after.ref.parent.child('thumbURL').set(thumbFileUrl);
  });

});

