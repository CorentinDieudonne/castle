//Required libraries for scraping
let Promise = require('promise');
let request = require('request');
let cheerio = require('cheerio');
let fs = require('fs');

var scrapperindex = 1;
var list_promise = [];
var list_indiv_promises = [];
var list_hotel = [];


function createPromise() {
  var url = 'https://www.relaischateaux.com/fr/site-map/etablissements';
  list_promise.push(fill_list_hotel(url));
  console.log("RC added to the list");
}

function create_list_indiv_promise() 
{
  return new Promise(function(resolve) 
  {
    if (scrapperindex === 1) 
	{
      for (var i = 0; i < Math.trunc(list_hotel.length / 2); i++) 
	  {
        let hotelURL = list_hotel[i].url;
        list_indiv_promises.push(hotel_info(hotelURL, i));
      }
      resolve();
      scrapperindex++;
    }
	else if (scrapperindex === 2) 
	{
      for (var i = list_hotel.length / 2; i < Math.trunc(list_hotel.length); i++) 
	  {
        let hotelURL = list_hotel[i].url;
        list_indiv_promises.push(hotel_info(hotelURL, i));
      }
      resolve();
    }
  })
}


function fill_list_hotel(url) 
{
  return new Promise(function(resolve, reject) 
  {
    request(url, function(err, res, html) 
	{
      if (err) 
	  {
        console.log(err);
        return reject(err);
      }
	  else if (res.statusCode !== 200) 
	  {
        err = new Error("Unexpected status code : " + res.statusCode);
        err.res = res;
        return reject(err);
      }
      var $ = cheerio.load(html);

      var hotelsFrance = $('h3:contains("France")').next();
      hotelsFrance.find('li').length;
      hotelsFrance.find('li').each(function() {
        let data = $(this);
        let url = String(data.find('a').attr("href"));
        let name = data.find('a').first().text();
        name = name.replace(/\n/g, "");
        let chefName = String(data.find('a:contains("Chef")').text().split(' - ')[1]);
        chefName = chefName.replace(/\n/g, "");
        list_hotel.push(
		{
          "name": name.trim(),
          "postalCode": "",
          "chef": chefName.trim(),
          "url": url,
          "price": ""
        }
		)
      });
      resolve(list_hotel);
    });
  });
}


function hotel_info(url, index) {
  return new Promise(function(resolve, reject) {
    request(url, function(err, res, html) {
      if (err) 
	  {
        console.error(err);
        return reject(err);
      }
	  else if (res.statusCode !== 200)
	  {
        err = new Error("Unexpected status code : " + res.statusCode);
        err.res = res;
        return reject(err);
      }

      const $ = cheerio.load(html);

      $('span[itemprop="postalCode"]').first().each(function() 
	  {
        let data = $(this);
        let pc = data.text();
        list_hotel[index].postalCode = String(pc.split(',')[0]).trim();
      });

      $('.price').first().each(function() 
	  {
        let data = $(this);
        let price = data.text();
        list_hotel[index].price = String(price);
      });
      resolve(list_hotel);
    });
  });
}

function hotelssavedjson() 
{
  return new Promise(function(resolve)
  {
    try {
      console.log("Edit JSON file");
      var jsonHotels = JSON.stringify(list_hotel);
      fs.writeFile("RC.json", jsonHotels, function doneWriting(err) 
	  {
        if (err) 
		{
          console.log(err);
        }
      });
    } 
	catch (error) 
	{
      console.error(error);
    }
    resolve();
  });
}


createPromise();
var prom = list_promise[0];
prom
  .then(create_list_indiv_promise)
  .then(() => 
  {
    return Promise.all(list_indiv_promises);
  })
  .then(create_list_indiv_promise)
  .then(() => 
  {
    return Promise.all(list_indiv_promises);
  })
  .then(hotelssavedjson)
  .then(() => {
    console.log("Hotels Saved")
  });

module.exports.getHotelsJSON = function() {
  return JSON.parse(fs.readFileSync("RC.json"));
};