/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

const querystring = require('querystring');
const fs = require('fs');

var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

// var messages = [];


// class Message {
//   constructor(message, room = null) {
//     this.content = message;

//     this.room = room;
//   }

//   get() {
//     return this.content;
//   }
// }





class Messages {
  constructor() {
    this.arr = [];
  }

  getMessages() {
    return this.arr;
  }

  getRoom(room) {
    // declare an output array
    var output = [];
    // iterate through this.arr
    this.arr.forEach(function(message) {
      // if message.room === room
      if (message.room === room) {
        //push message into output array
        output.push(message);
      }
    });
    // return output
    return output;
  }

  getUser(userName) {
    // filter by username and return
  }

  // add a new message to the array
  push(message, room) {
    if (room !== undefined) {
      message.room = room.toString();
    }

    this.arr.push(message);
  }

}

const messages = new Messages();
// messages.arr = [];

// messages.getMessages = function() {
//   let result = [];
  
//   for (let i = 0; i < this.arr.length; i++) {
//     result.push(this.arr[i].get());
//   }

//   return result;
// };



// const getMessages = function() {
//   let result = [];
  
//   for (let i = 0; i < messages.length; i++) {
//     result.push(messages[i].get());
//   }

//   return result;
// };


var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  console.log('url', request.url);

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  console.log('Serving request type ' + request.method + ' for url ' + request.url);

  // The outgoing status.
  var statusCode = 200;

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  // Tell the client we are sending them plain text.
  //
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.
  headers['Content-Type'] = 'text/plain';

  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  // response.writeHead(statusCode, headers);

  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
  // response.end('Hello, World!');

   // req.on('data', function (data) {
   //      body += data;
   //  });

  // console.log('requests', request.url, request.method, '\n\n');


  if (request.method === 'GET') {
    if (request.url.slice(0, 10) === '?username=') {
      
      response.writeHead(statusCode, headers);
      response.end(JSON.stringify({'key': 'value'}));

    } else if (request.url === '/classes/messages') {
      response.writeHead(statusCode, headers);
      response.end('' + JSON.stringify({
        results: messages.getMessages()
      }));
    } else if (request.url.slice(0, 9) === '/classes/') {
      let roomName = request.url.slice(9);
      response.writeHead(statusCode, headers);
      response.end('' + JSON.stringify({
        results: messages.getRoom(roomName)
      }));
    } else if (request.url === '/') {
      // give them the index.html page
      // response.writeHead(statusCode, headers);
      // response.end('' + 'Display the index page');

      response.writeHead(200, {'Content-Type': 'text/html'});

      var readStream = fs.createReadStream(__dirname + '/../client/index.html');
      // We replaced all the event handlers with a simple call to readStream.pipe()
      readStream.pipe(response);


    } else if (request.url.slice(0, 11) === '/?username=') {
      // response.writeHead(statusCode, headers);
      // response.end('You are someone who has the index.html page loaded and is requesting stuff');
      
      response.writeHead(200, {'Content-Type': 'text/html'});

      var readStream = fs.createReadStream(__dirname + '/../client/index.html');
      readStream.pipe(response);
    } else {
      response.writeHead(404, headers);
      response.end('Page not found: ' + request.url);
    }
  } else if (request.method === 'POST') {
    if (request.url === '/classes/messages') {
      let body = [];
      request.on('data', (chunk) => {
        body.push(chunk);
      });
      request.on('end', () => {
        body = body.join('');

        body = JSON.parse(body);

        messages.push(body);
        response.writeHead(201, headers);

        let previousMessages = messages.getMessages();
        previousMessages = previousMessages.slice(0, previousMessages.length - 1);

        response.end('' + JSON.stringify({results: previousMessages}));
      });
    } else if (request.url.slice(0, 9) === '/classes/') {
      let body = [];
      request.on('data', (chunk) => {
        body.push(chunk);
      });
      request.on('end', () => {
        body = body.join('');
        // at this point, `body` has the entire request body stored in it as a string
        // body = parse
        body = JSON.parse(body);
        // other 3 lines
        messages.push(body, request.url.slice(9));
        response.writeHead(201, headers);
        response.end('' + JSON.stringify({results: messages.getMessages()}));
      });      
    } else {
      response.writeHead(404, headers);
      response.end('Page not found: ' + request.url);
    }
  } else if (request.method === 'DELETE') {
    var isDeleted = false;

    if (request.url.slice(0, 17) === '/classes/message/') {
      var messageToDelete = querystring.unescape(request.url.slice(17));
      // iterate through message array
      var nonDeleted = [];

      for (let i = 0; i < messages.arr.length; i++) {
        const thisMessage = messages.arr[i];

        if (thisMessage.message !== messageToDelete) {
          nonDeleted.push(thisMessage);
        } else {
          isDeleted = true;
        }
      }

      messages.arr = nonDeleted;
    } else if (request.url.slice(0, 14) === '/classes/user/') {
      var userToDelete = querystring.unescape(request.url.slice(14));
      var nonDeleted = [];

      for (let i = 0; i < messages.arr.length; i++) {
        const thisMessage = messages.arr[i];

        if (thisMessage.username !== userToDelete) {
          nonDeleted.push(thisMessage);
        } else {
          isDeleted = true;
        }
      }
      
      messages.arr = nonDeleted;
    }

    if (isDeleted === true) {
      response.end('Your deletion has occurred');
    } else {
      response.end('Could not find any matching data');
    }
  } else if (request.method === 'OPTIONS') {
    response.writeHead(statusCode, headers);
    response.end(JSON.stringify(
      {
        'GET': {
          'description': 'Get messages',
          'parameters': false,
          'urlStructure': {
            '/classes/messages': 'returns all messages',
            '/classes/': 'returns all messages from the room whos name matches the following portion of the url'
          },
          'example': {
            'url': '/classes/messages'
          }
        },
        'POST': {
          'description': 'Send a message',
          'parameters': {
            'message': {
              'message': 'The body of the message',
              'username': 'The author of the message'
            }
          },
          'urlStructure': {
            '/classes/messages': 'sends a message that will not get a room property added',
            '/classes/': 'sends a message that will get a room property with the value of the remainder of the url'
          },
          'example1': {
            'message': {
              'message': 'Hello World!',
              'username': 'A Programmer'
            },
            'urlStructure': '/classes/messages'
          },
          'example1Outcome': 'This will post a message that will not have a room property',
          'example2': {
            'message': {
              'message': 'Hello World!',
              'username': 'A Programmer'
            },
            'urlStructure': '/classes/messages/ThisRoom'
          },
          'example2Outcome': 'This will produce the same result as the previous, with the addition of a room property of "ThisRoom"'
        }
      }
    ));
  }
};



// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.

exports.requestHandler = requestHandler;
