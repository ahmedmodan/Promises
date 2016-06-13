// use strict is for es6
'use strict';
// require the two modules we will be using for this file.
const request = require('request');
const axios = require('axios');

// 83d07e6a428233fea8fd116228f2fd2c
// if the above appID does not work get your own free one from openweathermap.org
const appID = 'INSERT_APP_ID_HERE';
// write a function that takes in a city name and then returns a string that we can make api calls to.
const getURL = city => `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${appID}`;

// function that will convert the temp from kelvin to fahrenheit.
function convertKelvin(num) {
  return Math.round((1.8 * (num - 273)) + 32);
}

// this is a get request for the weather in SF. it will console.log the temp.
// notice that it takes in a callback for a second argument.
request.get(getURL('sanfrancisco'), (err, data) => {
  if (err) throw err;
  console.log(convertKelvin(JSON.parse(data.body).main.temp));
});

// this is also a get request for the weather in SF. but this one uses promises.
axios.get(getURL('sanfrancisco'))
  .then(data => console.log(convertKelvin(data.data.main.temp)));

// we will promisify the request.get callback version of the get request here.
function getWeather(url) {
  // IT IS IMPORTANT TO NOTE that you have to return a promise here.
  return new Promise(function (resolve, reject) {
    request.get(getURL(url), function (err, response) {
      // saving the temperature into a variable
      const temp = convertKelvin(JSON.parse(response.body).main.temp);
      // not really error handling, just reject if the temp is less than 50 f.
      if(temp < 50) {
        reject(response)
      } else {
        resolve(temp);
      }
    })
  })
}

// call getWeather.
getWeather('sanfrancisco') // when you call getWeather it returns a promise.
  .then(function (data) {  // and because it returned a promise it is thenable.
    return data;           // the .then will take in two arguments.
  }, function (err) {      // the first will be a resolve function
    console.error('Error:', err); //  and the second will be the reject function
  })
  .then(function (data) {
    console.log('weather for SF:', data); // functions inside of .thens can return two things.
    return getWeather('cairo');   // they can return values like line 49 does or return promises like this line.
  })                                      // when you return promises the next .then will wait on the promise before executing.
  .then(function (data) {
    console.log('weather for Cairo:', data)
  })
  .then(function () { // you can chain on .thens even if you didn't return anything previously because .thens also return promises
    return 5;
  })
  .then(function (num) {
    console.log(num);
  })
  .catch(function (err) { // remember .catch is just like .then but you are only passing in the reject and no resolve
    console.error('Error:', err);
  });
/*
.catch(err => console.error('Error:', err));
is equivalent to
.then(undefined, err => console.error('Error:', err);
 */

// Promise.resolve is good if you want to only handle the resolved promise. this will never reject a promise.
const weather = Promise.resolve(getWeather('sanfrancisco'));
weather.then(function(data) {
  console.log(data);
});


/*
how to deal with an array of promises.
here we are mapping this array into a new array.
and when we map we actually make a get request and are returning a promise
from the getWeather function.
so citiesWeather will be an array of promises
*/
const citiesWeather = ['sanfrancisco', 'newyork', 'boston', 'tokyo', 'sydney'].map(city => getWeather(city));
/*
if we try to console.log citiesWeather here it will be an array of pending promises
because javascript will run the following line before the async calls have been able to fulfill.
*/
console.log(citiesWeather);

/*
if we wrap citiesWeather in Promise.all, promise.all will wait until all of the
promises inside of citiesWeather have resolved and then return a new promise to you
where you have access to the array with all of the resolved promises.
in the example below we are we are grabbing that array and using a forEach
loop to just log each temp to the console.
 */
Promise.all(citiesWeather)
  .then(arr => arr.forEach(temp => console.log(temp)));

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
/*

THE FOLLOWING MATERIAL WAS NOT COVERED IN THE LECTURE
IT IS A LITTLE BIT MORE ADVANCED STUFF AND YOU DON'T REALLY NEED TO KNOW IT
HOWEVER IF YOU ARE INTERESTED IT IS THERE FOR YOU TO CHECK OUT

*/

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/*
this is fetch. fetch is like axios but it will eventually be built into browsers
it is not part of javascript, it is a web API.
it works a little bit differently as the body for the response it recieves is actually
a stream which needs to be read to completion using one of the methods provided by the fetch API
these methods return a promise.
this is a very good example of how you might chain a few .thens in the real world.
*/
const fetch = require('isomorphic-fetch');
fetch(getURL('sanfrancisco'))
  .then(response => response.json())
  .then(data => console.log(convertKelvin(data.main.temp)));

/*
we are going to be promisifying an XMLHttpRequest here.
if you don't want to use fetch because you don't want to polyfill
as fetch is not built into browsers just yet
you can promisify a regular XMLHttpRequest.
XHR are also part of the web API, again not part of javascript.
because this whole example is in a file that will be run by node and not the browser
we need to install an npm module to get XHRs to work in node.
that is what line 141 is doing.
normally when we use XHR on the client side we don't need to require 'xhr2'
*/
const XMLHttpRequest = require('xhr2');

// promisify an XMLHttpRequest
const getWeatherXHR = function (url) {
  return new Promise(function (resolve, reject) {
    const req = new XMLHttpRequest();
    req.open('GET', url);
    req.onload = function () {
      if(req.status === 200) {
        resolve(JSON.parse(req.response).main.temp);
      } else {
        reject(Error(req.statusText));
      }
    };
    req.onerror = function() {
      reject(Error('network error'));
    };
    req.send();
  })
};

getWeatherXHR(getURL('sanfrancisco')).then(function(data) {
  console.log(convertKelvin(data));
}, function (err) {
  console.log(err)
});
