var assert = require('assert')
var mongoose = require('mongoose')

var Host = require('../models/Host')

mongoose.connect('mongodb://localhost/vippy_test');

mongoose.connection
    .once('open', () => console.log('Connected!'))
    .on('error', (error) => {
        console.warn('Error : ',error);
    });

//Called hooks which runs before something.
beforeEach((done) => {
    mongoose.connection.collections.hosts.drop(() => {
         //this function runs after the drop is completed
        done(); //go ahead everything is done now.
    });
});

describe("all CRUD Operations on a Host document should work", () => {
  it("Create a Host document", (done) => {
    const testHost = new Host({
      email: "john@johnraymon.com",
      fullname: "John Mendez",
      zipcode: "32825",
      phonenumber: 4073075504
    })

    testHost.save().then((host) => {
      console.log('The host document looks like', host)
      assert(!host.isNew)
    }).then(done, done)
  })
})
