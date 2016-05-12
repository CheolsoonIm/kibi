var expect = require('expect.js');

define(function (require) {
  var fieldExcludedFor = require('../kibi_field_excluded_for');

  describe('Settings', function () {
    describe('Indices', function () {
      describe('fieldExcludedFor(sourceFiltering, name)', function () {

        it('should be a function', function () {
          expect(fieldExcludedFor).to.be.a(Function);
        });

        it('john should not be excluded', function () {
          var sourceFiltering = {
            all: {
              include: 'john'
            }
          };
          expect(fieldExcludedFor(sourceFiltering, 'john')).to.eql([]);
        });


        it('john should be excluded for graph', function () {
          var sourceFiltering = {
            all: {
              include: 'john'
            },
            graph_vis: {
              exclude: 'john'
            }
          };
          expect(fieldExcludedFor(sourceFiltering, 'john')).to.eql(['graph_vis']);
        });

        it('connor should be excluded for all', function () {
          var sourceFiltering = {
            all: {
              exclude: 'connor'
            }
          };

          expect(fieldExcludedFor(sourceFiltering, 'connor')).to.eql(['all']);
        });

        it('connor should be excluded for all and graph', function () {
          var sourceFiltering = {
            all: {
              exclude: 'connor'
            },
            graph_vis: {
              exclude: 'connor'
            }
          };

          expect(fieldExcludedFor(sourceFiltering, 'connor')).to.eql(['all', 'graph_vis']);
        });


        it('connor should not be excluded', function () {
          var sourceFiltering = {
            all: {
              exclude: '*.connor'
            }
          };

          expect(fieldExcludedFor(sourceFiltering, 'connor')).to.eql([]);
          expect(fieldExcludedFor(sourceFiltering, 'john.connor')).to.eql(['all']);
        });

        it('john or connor should be excluded', function () {
          var sourceFiltering = {
            all: {
              exclude: [ 'john', 'connor' ]
            }
          };

          expect(fieldExcludedFor(sourceFiltering, 'connor')).to.eql(['all']);
          expect(fieldExcludedFor(sourceFiltering, 'john')).to.eql(['all']);
          expect(fieldExcludedFor(sourceFiltering, 'toto')).to.eql([]);
        });

        it('john.*.connor should be excluded', function () {
          var sourceFiltering = {
            all: {
              exclude: 'john.*.connor'
            }
          };

          expect(fieldExcludedFor(sourceFiltering, 'john.j.connor')).to.eql(['all']);
          expect(fieldExcludedFor(sourceFiltering, 'john.t.connor')).to.eql(['all']);
          expect(fieldExcludedFor(sourceFiltering, 'john.j.watterson')).to.eql([]);
        });

      });
    });
  });
});
