const { Model } = require('../../../');
const { expect } = require('chai');

module.exports = session => {
  describe(`upsertGraph on $relatedQuery does not take keys of relation into account`, () => {
    let knex = session.knex;
    let Person, Animal;

    before(() => {
      return knex.schema
        .createTable('Person', table => {
          table.increments('id').primary();
          table
            .integer('userId')
            .unsigned()
            .notNullable();
          table.string('firstName');
          table.string('lastName');
        })
        .createTable('Animal', table => {
          table.increments('id').primary();
          table
            .integer('userId')
            .unsigned()
            .notNullable();
          table.string('name');
          table.string('species');
        });
    });

    after(() => {
      return knex.schema.dropTableIfExists('Animal').dropTableIfExists('Person');
    });

    beforeEach(() => {
      Animal = class Animal extends Model {
        static get tableName() {
          return 'Animal';
        }

        static get relationMappings() {
          return {
            owner: {
              relation: Model.BelongsToOneRelation,
              modelClass: Person,
              join: {
                from: 'Animal.userId',
                to: 'Person.userId'
              }
            }
          };
        }
      };

      Animal.knex(knex);
    });

    beforeEach(() => {
      Person = class Person extends Model {
        static get tableName() {
          return 'Person';
        }

        static get relationMappings() {
          return {
            pets: {
              relation: Model.HasManyRelation,
              modelClass: Animal,
              join: {
                from: 'Person.userId',
                to: 'Animal.userId'
              }
            }
          };
        }
      };

      Person.knex(knex);
    });

    beforeEach(() => Animal.query().delete());
    beforeEach(() => Person.query().delete());

    beforeEach(() => {
      return Person.query().insertGraph({
        firstName: 'Jennifer',
        lastName: 'Lawrence',
        userId: 1,

        pets: [
          {
            name: 'Doggo',
            species: 'dog'
          },
          {
            name: 'Grumpy',
            species: 'cat'
          }
        ]
      });
    });

    it('test', () => {
      return Person.query()
        .upsertGraph(
          {
            id: 1,
            pets: [
              {
                name: 'Peppa',
                species: 'pig'
              }
            ]
          },
          { noDelete: true }
        )
        .then(() => {
          return Person.query().findOne({ firstName: 'Jennifer' });
        })
        .then(person => {
          return person.$relatedQuery('pets').upsertGraphAndFetch({
            name: 'George',
            species: 'pig'
          });
        })
        .then(pets => {
          expect(pets.userId).to.equal(1);
        });
    });
  });
};
