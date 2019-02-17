let cheerio = require('cheerio');
let fs = require('fs');
let Promise = require('promise');
let request = require('request');




var list_promises = [];
var list_promises_indiv = [];
var list_restaurant = [];
var scrapper_index = 1;
console.log("Write JSON");

function createPromises() {
  for (var i = 1; i <= 37; i++) {
    let url = 'https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-' + i.toString();
    list_promises.push(fill_list_resto(url));
    
  }
}

function create_promises_indiv() {
  return new Promise(function(resolve) {
    if (scrapper_index === 1) {
      for (var i = 0; i < list_restaurant.length / 2; i++) {
        let restaurantURL = list_restaurant[i].url;
        list_promises_indiv.push(fill_resto_info(restaurantURL, i));
       
      }
      resolve();
      scrapper_index++;
    }
    if (scrapper_index === 2) {
      for (var i = list_restaurant.length / 2; i < list_restaurant.length; i++) {
        let restaurantURL = list_restaurant[i].url;
        list_promises_indiv.push(fill_resto_info(restaurantURL, i));
       
      }
      resolve();
    }
  })
}


function fill_list_resto(url) {
  return new Promise(function(resolve, reject) {
    request(url, function(err, res, html) {
      if (err) {
        console.error(err);
        return reject(err);
      } else if (res.statusCode !== 200) {
        err = new Error("Unexpected status code : " + res.statusCode);
        err.res = res;
        console.error(err);
        return reject(err);
      }
      let $ = cheerio.load(html);
      $('.poi-card-link').each(function() {
        let data = $(this);
        let link = data.attr("href");
        let url = "https://restaurant.michelin.fr/" + link;
        list_restaurant.push({
          "name": "",
          "postalCode": "",
          "chef": "",
          "url": url
        })
      });
      resolve(list_restaurant);
    });
  });
}


function fill_resto_info(url, index) {
  return new Promise(function(resolve, reject) {
    request(url, function(err, res, html) {
      if (err) {
        console.error(err);
        return reject(err);
      } else if (res.statusCode !== 200) {
        err = new Error("Unexpected status code : " + res.statusCode);
        err.res = res;
        console.error(err);
        return reject(err);
      }

      const $ = cheerio.load(html);
      $('.poi_intro-display-title').first().each(function() {
        let data = $(this);
        let name = data.text();
        name = name.replace(/\n/g, "");
        list_restaurant[index].name = name.trim();
      });

      $('.postal-code').first().each(function() {
        let data = $(this);
        let pc = data.text();
        list_restaurant[index].postalCode = pc;
      });

      $('#node_poi-menu-wrapper > div.node_poi-chef > div.node_poi_description > div.field.field--name-field-chef.field--type-text.field--label-above > div.field__items > div').first().each(function() {
        let data = $(this);
        let chefname = data.text();
        list_restaurant[index].chef = chefname;
      });
      
      resolve(list_restaurant);
    });
  });
}


function saveRestaurantsInJson() {
  return new Promise(function(resolve) {
    try {
      
      let jsonRestaurants = JSON.stringify(list_restaurant);
      fs.writeFile("Resto.json", jsonRestaurants, function doneWriting(err) {
        if (err) {
          console.error(err);
        }
      });
    } catch (error) {
      console.error(error);
    }
    resolve();
  });
}


createPromises();
Promise.all(list_promises)
  .then(create_promises_indiv)
  .then(() => {
    return Promise.all(list_promises_indiv);
  })
  .then(create_promises_indiv)
  .then(() => {
    return Promise.all(list_promises_indiv);
  })
  .then(saveRestaurantsInJson)
  .then(() => {
    console.log("Saved Resto")
  });

module.exports.getRestaurantsJSON = function() {
  return JSON.parse(fs.readFileSync("Resto.json"));
};