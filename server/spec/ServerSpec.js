var handler = require('../request-handler');
var expect = require('chai').expect;
var stubs = require('./Stubs');

// Conditional async testing, akin to Jasmine's waitsFor()
// Will wait for test to be truthy before executing callback
var waitForThen = function (test, cb) {
  setTimeout(function() {
    test() ? cb.apply(this) : waitForThen(test, cb);
  }, 5);
};

describe('Node Server Request Listener Function', function() {
  it('Should answer GET requests for /classes/messages with a 200 status code', function() {
    // This is a fake server request. Normally, the server would provide this,
    // but we want to test our function's behavior totally independent of the server code
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    expect(res._ended).to.equal(true);
  });

  it('Should send back parsable stringified JSON', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(JSON.parse.bind(this, res._data)).to.not.throw();
    expect(res._ended).to.equal(true);
  });

  it('Should send back an object', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.be.an('object');
    expect(res._ended).to.equal(true);
  });

  it('Should send an object containing a `results` array', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.have.property('results');
    expect(parsedBody.results).to.be.an('array');
    expect(res._ended).to.equal(true);
  });

  it('Should accept posts to /classes/room', function() {
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var req = new stubs.request('/classes/messages', 'POST', stubMsg);
    var res = new stubs.response();

    handler.requestHandler(req, res);

    // Expect 201 Created response status
    expect(res._responseCode).to.equal(201);

    // Testing for a newline isn't a valid test
    // TODO: Replace with with a valid test
    // expect(res._data).to.equal(JSON.stringify('\n'));
    expect(res._ended).to.equal(true);
  });

  it('Should respond with messages that were previously posted', function() {
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var req = new stubs.request('/classes/messages', 'POST', stubMsg);
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(201);

      // Now if we request the log for that room the message we posted should be there:
    req = new stubs.request('/classes/messages', 'GET');
    res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    var messages = JSON.parse(res._data).results;
    expect(messages.length).to.be.above(0);
    expect(messages[0].username).to.equal('Jono');
    expect(messages[0].message).to.equal('Do my bidding!');
    expect(res._ended).to.equal(true);
  });


  it('Should 404 when asked for a nonexistent file', function() {
    var req = new stubs.request('/arglebargle', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    // Wait for response to return and then check status code
    waitForThen(
      function() { return res._ended; },
      function() {
        expect(res._responseCode).to.equal(404);
      });
  });

});

// handle tests for if the user is in a particular room
// the most recent message added (was added with a room) has a 'room' attribute
// the most recent message added (was NOT added with a room) does NOT have a 'room' attribute
// the most recent message added (was added with a room) has the expected value for its 'room' attribute
describe('messages can have a room', function() {

  it('has a room', function() {
  // add
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var reqPost = new stubs.request('/classes/room', 'POST', stubMsg);
    var resPost = new stubs.response();
    handler.requestHandler(reqPost, resPost);

    var reqGet = new stubs.request('/classes/messages', 'GET');
    var resGet = new stubs.response();
    handler.requestHandler(reqGet, resGet);

    var messages = JSON.parse(resGet._data).results;
    expect(messages[messages.length - 1].room).to.be.a('string');
  });

  it('does not have a room', function() {
  
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var reqPost = new stubs.request('/classes/messages', 'POST', stubMsg);
    var resPost = new stubs.response();
    handler.requestHandler(reqPost, resPost);

    var reqGet = new stubs.request('/classes/messages', 'GET');
    var resGet = new stubs.response();
    handler.requestHandler(reqGet, resGet);

    var messages = JSON.parse(resGet._data).results;
    expect(messages[messages.length - 1].room).to.equal(undefined);

  });

  it('has a room with the value we would expect', function() {
    
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var reqPost = new stubs.request('/classes/room', 'POST', stubMsg);
    var resPost = new stubs.response();
    handler.requestHandler(reqPost, resPost);

    var reqGet = new stubs.request('/classes/messages', 'GET');
    var resGet = new stubs.response();
    handler.requestHandler(reqGet, resGet);

    var messages = JSON.parse(resGet._data).results;
    expect(messages[messages.length - 1].room).to.equal('room');
    
  });

});


// allow the user to get just the messages for a particular room
describe('allow the user to get only the messages for a particular room', function() {

  before( function() {
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };

    var otherMsg = {
      username: 'otherName',
      message: 'otherMessage'
    };

    var reqPost = new stubs.request('/classes/thisRoom', 'POST', stubMsg);
    var resPost = new stubs.response();
    handler.requestHandler(reqPost, resPost);

    reqPost = new stubs.request('/classes/notThisRoom', 'POST', otherMsg);
    resPost = new stubs.response();
    handler.requestHandler(reqPost, resPost);

    reqPost = new stubs.request('/classes/thisRoom', 'POST', stubMsg);
    resPost = new stubs.response();
    handler.requestHandler(reqPost, resPost);

  });

  it('does get messages with a particular room', function() {
  
    var reqGet = new stubs.request('/classes/thisRoom', 'GET');
    var resGet = new stubs.response();
    handler.requestHandler(reqGet, resGet);

    var messages = JSON.parse(resGet._data).results;

    expect(messages.length).to.equal(2);    

    expect(messages[0]).to.eql({
      username: 'Jono',
      message: 'Do my bidding!',
      room: 'thisRoom'
    });

    expect(messages[1]).to.eql({
      username: 'Jono',
      message: 'Do my bidding!',
      room: 'thisRoom'
    });
  });

});



// allow the user to delete a message
  // at least allow for deletion by message and/or username
  // this will allow us to remove the test data 
    // which is especially good for when we add in message persistance below
    // possibly do a path for 'DELETE', '/testData' (instead of messages), to delete every instance of test data
  // other path: 'DELETE', '/classes/message/MessageTextHere' && '/classes/user/UserNameHere'
  // NOTE: this method is good for us deleting hardcoded data, but bad for a user deleting dynamic data


// if the user goes to the url http://127.0.0.1:3000, then they will get an html page back
  // this way they actually have the client side interface


// save the data to a file (and on startup, read that file or create it, if it does not exist)
  // this way we will have our data even after we shut down the server





// allow the user to update an existing message





// XSS proof the code (escape everything) then test that



