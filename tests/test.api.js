import localforage from '../dist/localforage';

var unexpectedSuccess = () => {
  assert.fail(null, null, 'Unexpected success');
};

var DRIVERS = [
  localforage.INDEXEDDB,
  localforage.LOCALSTORAGE,
  localforage.WEBSQL
];

var driverApiMethods = [
  'getItem',
  'setItem',
  'clear',
  'length',
  'removeItem',
  'key',
  'keys'
];

describe('localForage API', function() {
  // https://github.com/mozilla/localForage#working-on-localforage
  it('has Promises available', function() {
    assert.typeOf(Promise, 'function');
  });
});

describe('localForage', () => {
  let appropriateDriver =
    (localforage.supports(localforage.INDEXEDDB) &&
     localforage.INDEXEDDB) ||
    (localforage.supports(localforage.WEBSQL) &&
     localforage.WEBSQL) ||
    (localforage.supports(localforage.LOCALSTORAGE) &&
     localforage.LOCALSTORAGE);

  it(`automatically selects the most appropriate driver (${appropriateDriver})`, () => {
    return localforage.ready()
      .then(() => {
        assert.equal(localforage.driver(), appropriateDriver);
      })
      .catch((error) => {
        assert.typeOf(error, 'Error');
        assert.equal(error.message, 'No available storage method found.');
        assert.isNull(localforage.driver());
      });
  });

  it('errors when a requested driver is not found [callback]', (done) => {
    localforage.getDriver('UnknownDriver', null, (error) => {
      assert.typeOf(error, 'Error');
      assert.equal(error.message, 'Driver not found.');
      done();
    });
  });

  it('errors when a requested driver is not found [promise]', () => {
    return localforage.getDriver('UnknownDriver')
      .then(unexpectedSuccess)
      .catch((error) => {
        assert.typeOf(error, 'Error');
        assert.equal(error.message, 'Driver not found.');
      });
  });

  it('retrieves the serializer [callback]', (done) => {
    localforage.getSerializer((serializer) => {
      assert.typeOf(serializer, 'object');
      done();
    });
  });

  it('retrieves the serializer [promise]', () => {
    var serializerPromise = localforage.getSerializer();
    assert.typeOf(serializerPromise, 'Promise');
    assert.typeOf(serializerPromise.then, 'function');

    return serializerPromise.then((serializer) => {
      assert.typeOf(serializer, 'object');
    });
  });

  it('does not support object parameter to setDriver', () => {
    var driverPreferedOrder = {
      '0': localforage.INDEXEDDB,
      '1': localforage.WEBSQL,
      '2': localforage.LOCALSTORAGE,
      length: 3
    };

    return localforage.setDriver(driverPreferedOrder)
      .then(unexpectedSuccess)
      .catch((error) => {
        assert.typeOf(error, 'Error');
        assert.equal(error.message, 'No available storage method found.');
      });
  });

  it('skips drivers that fail to initilize', () => {
    var failingStorageDriver = (function() {
      function driverDummyMethod() {
        return Promise.reject(new Error('Driver Method Failed.'));
      }

      return {
        _driver: 'failingStorageDriver',
        _initStorage: function _initStorage() {
          return Promise.reject(new Error('Driver Failed to Initialize.'));
        },
        iterate: driverDummyMethod,
        getItem: driverDummyMethod,
        setItem: driverDummyMethod,
        removeItem: driverDummyMethod,
        clear: driverDummyMethod,
        length: driverDummyMethod,
        key: driverDummyMethod,
        keys: driverDummyMethod
      };
    })();

    var driverPreferedOrder = [
      failingStorageDriver._driver,
      localforage.INDEXEDDB,
      localforage.WEBSQL,
      localforage.LOCALSTORAGE
    ];

    return localforage.defineDriver(failingStorageDriver)
      .then(() => {
        return localforage.setDriver(driverPreferedOrder);
      }).then(() => {
        return localforage.ready();
      }).then(() => {
        assert.equal(localforage.driver(), appropriateDriver);
      });
  });
});

DRIVERS.forEach(function(driverName) {
  if ((!localforage.supports(localforage.INDEXEDDB) &&
     driverName === localforage.INDEXEDDB) ||
    (!localforage.supports(localforage.LOCALSTORAGE) &&
     driverName === localforage.LOCALSTORAGE) ||
    (!localforage.supports(localforage.WEBSQL) &&
     driverName === localforage.WEBSQL)) {
    // Browser doesn't support this storage library, so we exit the API
    // tests.
    return;
  }

  describe(driverName + ' driver', function() {
    'use strict';

    // this.timeout(30000);

    before(function() {
      return localforage.setDriver(driverName);
    });

    beforeEach(function() {
      localStorage.clear();
      return localforage.ready()
        .then(function() {
          return localforage.clear();
        });
    });

    it('has a localStorage API', function() {
      assert.typeOf(localforage.getItem, 'function');
      assert.typeOf(localforage.setItem, 'function');
      assert.typeOf(localforage.clear, 'function');
      assert.typeOf(localforage.length, 'function');
      assert.typeOf(localforage.removeItem, 'function');
      assert.typeOf(localforage.key, 'function');
    });

    it('has the localForage API', function() {
      assert.typeOf(localforage._initStorage, 'function');
      assert.typeOf(localforage.config, 'function');
      assert.typeOf(localforage.defineDriver, 'function');
      assert.typeOf(localforage.driver, 'function');
      assert.typeOf(localforage.supports, 'function');
      assert.typeOf(localforage.iterate, 'function');
      assert.typeOf(localforage.getItem, 'function');
      assert.typeOf(localforage.setItem, 'function');
      assert.typeOf(localforage.clear, 'function');
      assert.typeOf(localforage.length, 'function');
      assert.typeOf(localforage.removeItem, 'function');
      assert.typeOf(localforage.key, 'function');
      assert.typeOf(localforage.getDriver, 'function');
      assert.typeOf(localforage.setDriver, 'function');
      assert.typeOf(localforage.ready, 'function');
      assert.typeOf(localforage.createInstance, 'function');
      assert.typeOf(localforage.getSerializer, 'function');
    });

    // Make sure we don't support bogus drivers.
    it(`supports ${driverName} database driver`, () => {
      assert.isTrue(localforage.supports(driverName));
      assert.isFalse(localforage.supports('I am not a driver'));
    });

    it('sets the right database driver', () => {
      assert.equal(localforage.driver(), driverName);
    });

    it('has an empty length by default', (done) => {
      localforage.length(function(err, length) {
        assert.equal(length, 0);
        done();
      });
    });

    if (driverName === localforage.INDEXEDDB) {
      describe('Blob support', () => {
        var transaction;
        var called = false;
        var db;
        var blob = new Blob([''], {type: 'image/png'});

        before(function() {
          db = localforage._dbInfo.db;
          transaction = db.transaction;
          db.transaction = function() {
            called = true;
            return transaction.apply(db, arguments);
          };
        });

        beforeEach(function() {
          called = false;
        });

        it('not check for non Blob', () => {
          assert.isFalse(called);
          return localforage.setItem('key', {})
            .then(() => {
              assert.isTrue(called);
            });
        });

        it('check for Blob', () => {
          assert.isFalse(called);
          return localforage.setItem('key', blob)
            .then(() => {
              assert.isTrue(called);
            });
        });

        it('check for Blob once', () => {
          assert.isFalse(called);
          return localforage.setItem('key', blob)
            .then(() => {
              assert.isTrue(called);
            });
        });

        after(() => {
          localforage._dbInfo.db.transaction = transaction;
        });
      });
    }

    it('should iterate [callback]', function(done) {
      localforage.setItem('officeX', 'InitechX', function(err, setValue) {
        assert.equal(setValue, 'InitechX');

        localforage.getItem('officeX', function(err, value) {
          assert.equal(value, setValue);

          localforage.setItem('officeY', 'InitechY',
                    function(err, setValue) {
            assert.equal(setValue, 'InitechY');

            localforage.getItem('officeY', function(err, value) {
              assert.equal(value, setValue);

              var accumulator = {};
              var iterationNumbers = [];

              localforage.iterate(function(value, key, iterationNumber) {
                accumulator[key] = value;
                iterationNumbers.push(iterationNumber);
              }, function() {
                try {
                  assert.equal(accumulator.officeX, 'InitechX');
                  assert.equal(accumulator.officeY, 'InitechY');
                  assert.deepEqual(iterationNumbers, [1, 2]);
                  done();
                } catch (e) {
                  done(e);
                }
              });
            });
          });
        });
      });
    });

    it('should iterate [promise]', () => {
      var accumulator = {};
      var iterationNumbers = [];

      return localforage.setItem('officeX', 'InitechX')
        .then((setValue) => {
          assert.equal(setValue, 'InitechX');
          return localforage.getItem('officeX');
        }).then((value) => {
          assert.equal(value, 'InitechX');
          return localforage.setItem('officeY', 'InitechY');
        }).then((setValue) => {
          assert.equal(setValue, 'InitechY');
          return localforage.getItem('officeY');
        }).then((value) => {
          assert.equal(value, 'InitechY');

          return localforage.iterate((value, key, iterationNumber) => {
            accumulator[key] = value;
            iterationNumbers.push(iterationNumber);
          });
        }).then(() => {
          assert.equal(accumulator.officeX, 'InitechX');
          assert.equal(accumulator.officeY, 'InitechY');
          assert.deepEqual(iterationNumbers, [1, 2]);
        });
    });
//
//     it('should break iteration with defined return value [callback]',
//        function(done) {
//       var breakCondition = 'Some value!';
//
//       localforage.setItem('officeX', 'InitechX', function(err, setValue) {
//         expect(setValue).to.be('InitechX');
//
//         localforage.getItem('officeX', function(err, value) {
//           expect(value).to.be(setValue);
//
//           localforage.setItem('officeY', 'InitechY',
//                     function(err, setValue) {
//             expect(setValue).to.be('InitechY');
//
//             localforage.getItem('officeY', function(err, value) {
//               expect(value).to.be(setValue);
//
//               // Loop is broken within first iteration.
//               localforage.iterate(function() {
//                 // Returning defined value will break the cycle.
//                 return breakCondition;
//               }, function(err, loopResult) {
//                 // The value that broken the cycle is returned
//                 // as a result.
//                 expect(loopResult).to.be(breakCondition);
//
//                 done();
//               });
//             });
//           });
//         });
//       });
//     });
//
//     it('should break iteration with defined return value [promise]',
//        function(done) {
//       var breakCondition = 'Some value!';
//
//       localforage.setItem('officeX', 'InitechX').then(function(setValue) {
//         expect(setValue).to.be('InitechX');
//         return localforage.getItem('officeX');
//       }).then(function(value) {
//         expect(value).to.be('InitechX');
//         return localforage.setItem('officeY', 'InitechY');
//       }).then(function(setValue) {
//         expect(setValue).to.be('InitechY');
//         return localforage.getItem('officeY');
//       }).then(function(value) {
//         expect(value).to.be('InitechY');
//         return localforage.iterate(function() {
//           return breakCondition;
//         });
//       }).then(function(result) {
//         expect(result).to.be(breakCondition);
//         done();
//       });
//     });
//
//     it('should iterate() through only its own keys/values', function(done) {
//       localStorage.setItem('local', 'forage');
//       localforage.setItem('office', 'Initech').then(function() {
//         return localforage.setItem('name', 'Bob');
//       }).then(function() {
//         // Loop through all key/value pairs; {local: 'forage'} set
//         // manually should not be returned.
//         var numberOfItems = 0;
//         var iterationNumberConcat = '';
//
//         localStorage.setItem('locals', 'forages');
//
//         localforage.iterate(function(value, key, iterationNumber) {
//           expect(key).to.not.be('local');
//           expect(value).to.not.be('forage');
//           numberOfItems++;
//           iterationNumberConcat += iterationNumber;
//         }, function(err) {
//           if (!err) {
//             // While there are 4 items in localStorage,
//             // only 2 items were set using localForage.
//             expect(numberOfItems).to.be(2);
//
//             // Only 2 items were set using localForage,
//             // so we should get '12' and not '1234'
//             expect(iterationNumberConcat).to.be('12');
//
//             done();
//           }
//         });
//       });
//     });
//
//     // Test for https://github.com/mozilla/localForage/issues/175
//     it('nested getItem inside clear works [callback]', function(done) {
//       localforage.setItem('hello', 'Hello World !', function() {
//         localforage.clear(function() {
//           localforage.getItem('hello', function(secondValue) {
//             expect(secondValue).to.be(null);
//             done();
//           });
//         });
//       });
//     });
//     it('nested getItem inside clear works [promise]', function(done) {
//       localforage.setItem('hello', 'Hello World !').then(function() {
//         return localforage.clear();
//       }).then(function() {
//         return localforage.getItem('hello');
//       }).then(function(secondValue) {
//         expect(secondValue).to.be(null);
//         done();
//       });
//     });
//
//     // Because localStorage doesn't support saving the `undefined` type, we
//     // always return `null` so that localForage is consistent across
//     // browsers.
//     // https://github.com/mozilla/localForage/pull/42
//     it('returns null for undefined key [callback]', function(done) {
//       localforage.getItem('key', function(err, value) {
//         expect(value).to.be(null);
//         done();
//       });
//     });
//
//     it('returns null for undefined key [promise]', function(done) {
//       localforage.getItem('key').then(function(value) {
//         expect(value).to.be(null);
//         done();
//       });
//     });
//
//     it('saves an item [callback]', function(done) {
//       localforage.setItem('office', 'Initech', function(err, setValue) {
//         expect(setValue).to.be('Initech');
//
//         localforage.getItem('office', function(err, value) {
//           expect(value).to.be(setValue);
//           done();
//         });
//       });
//     });
//
//     it('saves an item [promise]', function(done) {
//       localforage.setItem('office', 'Initech').then(function(setValue) {
//         expect(setValue).to.be('Initech');
//
//         return localforage.getItem('office');
//       }).then(function(value) {
//         expect(value).to.be('Initech');
//         done();
//       });
//     });
//
//     it('saves an item over an existing key [callback]', function(done) {
//       localforage.setItem('4th floor', 'Mozilla',
//                 function(err, setValue) {
//         expect(setValue).to.be('Mozilla');
//
//         localforage.setItem('4th floor', 'Quora',
//                   function(err, newValue) {
//           expect(newValue).to.not.be(setValue);
//           expect(newValue).to.be('Quora');
//
//           localforage.getItem('4th floor', function(err, value) {
//             expect(value).to.not.be(setValue);
//             expect(value).to.be(newValue);
//             done();
//           });
//         });
//       });
//     });
//     it('saves an item over an existing key [promise]', function(done) {
//       localforage.setItem('4e', 'Mozilla').then(function(setValue) {
//         expect(setValue).to.be('Mozilla');
//
//         return localforage.setItem('4e', 'Quora');
//       }).then(function(newValue) {
//         expect(newValue).to.not.be('Mozilla');
//         expect(newValue).to.be('Quora');
//
//         return localforage.getItem('4e');
//       }).then(function(value) {
//         expect(value).to.not.be('Mozilla');
//         expect(value).to.be('Quora');
//         done();
//       });
//     });
//
//     it('returns null when saving undefined [callback]', function(done) {
//       localforage.setItem('undef', undefined, function(err, setValue) {
//         expect(setValue).to.be(null);
//
//         done();
//       });
//     });
//     it('returns null when saving undefined [promise]', function(done) {
//       localforage.setItem('undef', undefined).then(function(setValue) {
//         expect(setValue).to.be(null);
//
//         done();
//       });
//     });
//
//     it('returns null for a non-existant key [callback]', function(done) {
//       localforage.getItem('undef', function(err, value) {
//         expect(value).to.be(null);
//
//         done();
//       });
//     });
//     it('returns null for a non-existant key [promise]', function(done) {
//       localforage.getItem('undef').then(function(value) {
//         expect(value).to.be(null);
//
//         done();
//       });
//     });
//
//     // github.com/mozilla/localforage/pull/24#discussion-diff-9389662R158
//     // localStorage's method API (`localStorage.getItem('foo')`) returns
//     // `null` for undefined keys, even though its getter/setter API
//     // (`localStorage.foo`) returns `undefined` for the same key. Gaia's
//     // asyncStorage API, which is based on localStorage and upon which
//     // localforage is based, ALSO returns `null`. BLARG! So for now, we
//     // just return null, because there's no way to know from localStorage
//     // if the key is ACTUALLY `null` or undefined but returning `null`.
//     // And returning `undefined` here would break compatibility with
//     // localStorage fallback. Maybe in the future we won't care...
//     it('returns null from an undefined key [callback]', function(done) {
//       localforage.key(0, function(err, key) {
//         expect(key).to.be(null);
//
//         done();
//       });
//     });
//     it('returns null from an undefined key [promise]', function(done) {
//       localforage.key(0).then(function(key) {
//         expect(key).to.be(null);
//
//         done();
//       });
//     });
//
//     it('returns key name [callback]', function(done) {
//       localforage.setItem('office', 'Initech').then(function() {
//         localforage.key(0, function(err, key) {
//           expect(key).to.be('office');
//
//           done();
//         });
//       });
//     });
//     it('returns key name [promise]', function(done) {
//       localforage.setItem('office', 'Initech').then(function() {
//         return localforage.key(0);
//       }).then(function(key) {
//         expect(key).to.be('office');
//
//         done();
//       });
//     });
//
//     it('removes an item [callback]', function(done) {
//       localforage.setItem('office', 'Initech', function() {
//         localforage.setItem('otherOffice', 'Initrode', function() {
//           localforage.removeItem('office', function() {
//             localforage.getItem('office',
//                       function(err, emptyValue) {
//               expect(emptyValue).to.be(null);
//
//               localforage.getItem('otherOffice',
//                         function(err, value) {
//                 expect(value).to.be('Initrode');
//
//                 done();
//               });
//             });
//           });
//         });
//       });
//     });
//     it('removes an item [promise]', function(done) {
//       localforage.setItem('office', 'Initech').then(function() {
//         return localforage.setItem('otherOffice', 'Initrode');
//       }).then(function() {
//         return localforage.removeItem('office');
//       }).then(function() {
//         return localforage.getItem('office');
//       }).then(function(emptyValue) {
//         expect(emptyValue).to.be(null);
//
//         return localforage.getItem('otherOffice');
//       }).then(function(value) {
//         expect(value).to.be('Initrode');
//
//         done();
//       });
//     });
//
//     it('removes all items [callback]', function(done) {
//       localforage.setItem('office', 'Initech', function() {
//         localforage.setItem('otherOffice', 'Initrode', function() {
//           localforage.length(function(err, length) {
//             expect(length).to.be(2);
//
//             localforage.clear(function() {
//               localforage.getItem('office', function(err, value) {
//                 expect(value).to.be(null);
//
//                 localforage.length(function(err, length) {
//                   expect(length).to.be(0);
//
//                   done();
//                 });
//               });
//             });
//           });
//         });
//       });
//     });
//     it('removes all items [promise]', function(done) {
//       localforage.setItem('office', 'Initech').then(function() {
//         return localforage.setItem('otherOffice', 'Initrode');
//       }).then(function() {
//         return localforage.length();
//       }).then(function(length) {
//         expect(length).to.be(2);
//
//         return localforage.clear();
//       }).then(function() {
//         return localforage.getItem('office');
//       }).then(function(value) {
//         expect(value).to.be(null);
//
//         return localforage.length();
//       }).then(function(length) {
//         expect(length).to.be(0);
//
//         done();
//       });
//     });
//
//     if (driverName === localforage.LOCALSTORAGE) {
//       it('removes only own items upon clear', function(done) {
//         localStorage.setItem('local', 'forage');
//
//         localforage.setItem('office', 'Initech').then(function() {
//           return localforage.clear();
//         }).then(function() {
//           expect(localStorage.getItem('local')).to.be('forage');
//
//           localStorage.clear();
//
//           done();
//         });
//       });
//
//       it('returns only its own keys from keys()', function(done) {
//         localStorage.setItem('local', 'forage');
//
//         localforage.setItem('office', 'Initech').then(function() {
//           return localforage.keys();
//         }).then(function(keys) {
//           expect(keys).to.eql(['office']);
//
//           localStorage.clear();
//
//           done();
//         });
//       });
//
//       it('counts only its own items with length()', function(done) {
//         localStorage.setItem('local', 'forage');
//         localStorage.setItem('another', 'value');
//
//         localforage.setItem('office', 'Initech').then(function() {
//           return localforage.length();
//         }).then(function(length) {
//           expect(length).to.be(1);
//
//           localStorage.clear();
//
//           done();
//         });
//       });
//     }
//
//     it('has a length after saving an item [callback]', function(done) {
//       localforage.length(function(err, length) {
//         expect(length).to.be(0);
//         localforage.setItem('rapper', 'Black Thought', function() {
//           localforage.length(function(err, length) {
//             expect(length).to.be(1);
//
//             done();
//           });
//         });
//       });
//     });
//     it('has a length after saving an item [promise]', function(done) {
//       localforage.length().then(function(length) {
//         expect(length).to.be(0);
//
//         return localforage.setItem('lame rapper', 'Vanilla Ice');
//       }).then(function() {
//         return localforage.length();
//       }).then(function(length) {
//         expect(length).to.be(1);
//
//         done();
//       });
//     });
//
//     // Deal with non-string keys, see issue #250
//     // https://github.com/mozilla/localForage/issues/250
//     it('casts an undefined key to a String', function(done) {
//       localforage.setItem(undefined, 'goodness!').then(function(value) {
//         expect(value).to.be('goodness!');
//
//         return localforage.getItem(undefined);
//       }).then(function(value) {
//         expect(value).to.be('goodness!');
//
//         return localforage.removeItem(undefined);
//       }).then(function() {
//         return localforage.length();
//       }).then(function(length) {
//         expect(length).to.be(0);
//         done();
//       });
//     });
//
//     it('casts a null key to a String', function(done) {
//       localforage.setItem(null, 'goodness!').then(function(value) {
//         expect(value).to.be('goodness!');
//
//         return localforage.getItem(null);
//       }).then(function(value) {
//         expect(value).to.be('goodness!');
//
//         return localforage.removeItem(null);
//       }).then(function() {
//         return localforage.length();
//       }).then(function(length) {
//         expect(length).to.be(0);
//         done();
//       });
//     });
//
//     it('casts a float key to a String', function(done) {
//       localforage.setItem(537.35737, 'goodness!').then(function(value) {
//         expect(value).to.be('goodness!');
//
//         return localforage.getItem(537.35737);
//       }).then(function(value) {
//         expect(value).to.be('goodness!');
//
//         return localforage.removeItem(537.35737);
//       }).then(function() {
//         return localforage.length();
//       }).then(function(length) {
//         expect(length).to.be(0);
//         done();
//       });
//     });
//
//     it('is retrieved by getDriver [callback]', function(done) {
//       localforage.getDriver(driverName, function(driver) {
//         expect(typeof driver).to.be('object');
//         driverApiMethods.concat('_initStorage').forEach(function(methodName) {
//           expect(typeof driver[methodName]).to.be('function');
//         });
//         expect(driver._driver).to.be(driverName);
//         done();
//       });
//     });
//
//     it('is retrieved by getDriver [promise]', function(done) {
//       localforage.getDriver(driverName).then(function(driver) {
//         expect(typeof driver).to.be('object');
//         driverApiMethods.concat('_initStorage').forEach(function(methodName) {
//           expect(typeof driver[methodName]).to.be('function');
//         });
//         expect(driver._driver).to.be(driverName);
//         done();
//       });
//     });
//
//     if (driverName === localforage.WEBSQL ||
//       driverName === localforage.LOCALSTORAGE) {
//       it('exposes the serializer on the dbInfo object', function(done) {
//         localforage.ready().then(function() {
//           expect(localforage._dbInfo.serializer).to.be.an('object');
//           done();
//         });
//       });
//     }
//   });
//
//   function prepareStorage(storageName) {
//     // Delete IndexedDB storages (start from scratch)
//     // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
//     if (driverName === localforage.INDEXEDDB) {
//       return new Promise(function(resolve) {
//         var indexedDB = (indexedDB || window.indexedDB ||
//                  window.webkitIndexedDB ||
//                  window.mozIndexedDB || window.OIndexedDB ||
//                  window.msIndexedDB);
//
//         indexedDB.deleteDatabase(storageName).onsuccess = resolve;
//       });
//     }
//
//     // Otherwise, do nothing
//     return Promise.resolve();
//   }
//
//   describe(driverName + ' driver multiple instances', function() {
//     'use strict';
//
//     this.timeout(30000);
//
//     var localforage2 = null;
//     var localforage3 = null;
//
//     before(function(done) {
//
//       prepareStorage('storage2').then(function() {
//         localforage2 = localforage.createInstance({
//           name: 'storage2',
//           // We need a small value here
//           // otherwise local PhantomJS test
//           // will fail with SECURITY_ERR.
//           // TravisCI seem to work fine though.
//           size: 1024,
//           storeName: 'storagename2'
//         });
//
//         // Same name, but different storeName since this has been
//         // malfunctioning before w/ IndexedDB.
//         localforage3 = localforage.createInstance({
//           name: 'storage2',
//           // We need a small value here
//           // otherwise local PhantomJS test
//           // will fail with SECURITY_ERR.
//           // TravisCI seem to work fine though.
//           size: 1024,
//           storeName: 'storagename3'
//         });
//
//         Promise.all([
//           localforage.setDriver(driverName),
//           localforage2.setDriver(driverName),
//           localforage3.setDriver(driverName)
//         ]).then(function() {
//           done();
//         });
//       });
//     });
//
//     beforeEach(function(done) {
//       Promise.all([
//         localforage.clear(),
//         localforage2.clear(),
//         localforage3.clear()
//       ]).then(function() {
//         done();
//       });
//     });
//
//     it('is not be able to access values of other instances', function(done) {
//       Promise.all([
//         localforage.setItem('key1', 'value1a'),
//         localforage2.setItem('key2', 'value2a'),
//         localforage3.setItem('key3', 'value3a')
//       ]).then(function() {
//         return Promise.all([
//           localforage.getItem('key2').then(function(value) {
//             expect(value).to.be(null);
//           }),
//           localforage2.getItem('key1').then(function(value) {
//             expect(value).to.be(null);
//           }),
//           localforage2.getItem('key3').then(function(value) {
//             expect(value).to.be(null);
//           }),
//           localforage3.getItem('key2').then(function(value) {
//             expect(value).to.be(null);
//           })
//         ]);
//       }).then(function() {
//         done();
//       }, function(errors) {
//         done(new Error(errors));
//       });
//     });
//
//     it('retrieves the proper value when using the same key with other instances', function(done) {
//       Promise.all([
//         localforage.setItem('key', 'value1'),
//         localforage2.setItem('key', 'value2'),
//         localforage3.setItem('key', 'value3')
//       ]).then(function() {
//         return Promise.all([
//           localforage.getItem('key').then(function(value) {
//             expect(value).to.be('value1');
//           }),
//           localforage2.getItem('key').then(function(value) {
//             expect(value).to.be('value2');
//           }),
//           localforage3.getItem('key').then(function(value) {
//             expect(value).to.be('value3');
//           })
//         ]);
//       }).then(function() {
//         done();
//       }, function(errors) {
//         done(new Error(errors));
//       });
//     });
//   });
//
//   // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
//   describe(driverName + ' driver multiple instances (concurrent on same database)', function() {
//
//     'use strict';
//
//     this.timeout(30000);
//
//     it('chains operation on multiple stores', function(done) {
//
//       prepareStorage('storage3').then(function() {
//         var localforage1 = localforage.createInstance({
//           name: 'storage3',
//           storeName: 'store1',
//           size: 1024
//         });
//
//         var localforage2 = localforage.createInstance({
//           name: 'storage3',
//           storeName: 'store2',
//           size: 1024
//         });
//
//         var localforage3 = localforage.createInstance({
//           name: 'storage3',
//           storeName: 'store3',
//           size: 1024
//         });
//
//         var promise1 = localforage1.setItem('key', 'value1').then(function() {
//           return localforage1.getItem('key');
//         }).then(function(value) {
//           expect(value).to.be('value1');
//         });
//
//         var promise2 = localforage2.setItem('key', 'value2').then(function() {
//           return localforage2.getItem('key');
//         }).then(function(value) {
//           expect(value).to.be('value2');
//         });
//
//         var promise3 = localforage3.setItem('key', 'value3').then(function() {
//           return localforage3.getItem('key');
//         }).then(function(value) {
//           expect(value).to.be('value3');
//         });
//
//         Promise.all([
//           promise1,
//           promise2,
//           promise3
//         ]).then(function() {
//           done();
//         }).catch(function(errors) {
//           done(new Error(errors));
//         });
//       });
//     });
//   });
//
//   describe(driverName + ' driver', function() {
//     'use strict';
//
//     var driverPreferedOrder;
//
//     before(function() {
//       // add some unsupported drivers before
//       // and after the target driver
//       driverPreferedOrder = ['I am a not supported driver'];
//
//       if (!localforage.supports(localforage.WEBSQL)) {
//         driverPreferedOrder.push(localforage.WEBSQL);
//       }
//       if (!localforage.supports(localforage.INDEXEDDB)) {
//         driverPreferedOrder.push(localforage.INDEXEDDB);
//       }
//       if (!localforage.supports(localforage.LOCALSTORAGE)) {
//         driverPreferedOrder.push(localforage.localStorage);
//       }
//
//       driverPreferedOrder.push(driverName);
//
//       driverPreferedOrder.push('I am another not supported driver');
//     });
//
//     it('is used according to setDriver preference order', function(done) {
//       localforage.setDriver(driverPreferedOrder).then(function() {
//         expect(localforage.driver()).to.be(driverName);
//         done();
//       });
//     });
//   });
//
//   describe(driverName + ' driver when the callback throws an Error', function() {
//     'use strict';
//
//     var testObj = {
//       throwFunc: function() {
//         testObj.throwFuncCalls++;
//         throw new Error('Thrown test error');
//       },
//       throwFuncCalls: 0
//     };
//
//     beforeEach(function(done) {
//       testObj.throwFuncCalls = 0;
//       done();
//     });
//
//     it('resolves the promise of getItem()', function(done) {
//       localforage.getItem('key', testObj.throwFunc).then(function() {
//         expect(testObj.throwFuncCalls).to.be(1);
//         done();
//       });
//     });
//
//     it('resolves the promise of setItem()', function(done) {
//       localforage.setItem('key', 'test', testObj.throwFunc).then(function() {
//         expect(testObj.throwFuncCalls).to.be(1);
//         done();
//       });
//     });
//
//     it('resolves the promise of clear()', function(done) {
//       localforage.clear(testObj.throwFunc).then(function() {
//         expect(testObj.throwFuncCalls).to.be(1);
//         done();
//       });
//     });
//
//     it('resolves the promise of length()', function(done) {
//       localforage.length(testObj.throwFunc).then(function() {
//         expect(testObj.throwFuncCalls).to.be(1);
//         done();
//       });
//     });
//
//     it('resolves the promise of removeItem()', function(done) {
//       localforage.removeItem('key', testObj.throwFunc).then(function() {
//         expect(testObj.throwFuncCalls).to.be(1);
//         done();
//       });
//     });
//
//     it('resolves the promise of key()', function(done) {
//       localforage.key('key', testObj.throwFunc).then(function() {
//         expect(testObj.throwFuncCalls).to.be(1);
//         done();
//       });
//     });
//
//     it('resolves the promise of keys()', function(done) {
//       localforage.keys(testObj.throwFunc).then(function() {
//         expect(testObj.throwFuncCalls).to.be(1);
//         done();
//       });
//     });
//   });
//
//   describe(driverName + ' driver when ready() gets rejected', function() {
//     'use strict';
//
//     this.timeout(30000);
//
//     var _oldReady;
//
//     beforeEach(function(done) {
//       _oldReady = localforage.ready;
//       localforage.ready = function() {
//         return Promise.reject();
//       };
//       done();
//     });
//
//     afterEach(function(done) {
//       localforage.ready = _oldReady;
//       _oldReady = null;
//       done();
//     });
//
//     driverApiMethods.forEach(function(methodName) {
//       it('rejects ' + methodName + '() promise', function(done) {
//         localforage[methodName]().then(null, function(/*err*/) {
//           done();
//         });
//       });
//     });
  });
});

DRIVERS.forEach((driverName) => {
  describe(driverName + ' driver instance', () => {
    it('creates a new instance and sets the driver', () => {
      var localforage2 = localforage.createInstance({
        name: 'storage2',
        driver: driverName,
        // We need a small value here
        // otherwise local PhantomJS test
        // will fail with SECURITY_ERR.
        // TravisCI seem to work fine though.
        size: 1024,
        storeName: 'storagename2'
      });

      // since config actually uses setDriver which is async,
      // and since driver() and supports() are not defered (are sync),
      // we have to wait till an async method returns
      return localforage2.length()
        .then(() => {
          assert.equal(localforage2.driver(), driverName);
        })
        .catch(() => {
          assert.isNull(localforage2.driver());
        });
    });
  });
});