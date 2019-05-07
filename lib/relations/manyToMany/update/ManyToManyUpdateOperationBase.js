'use strict';

const UpdateOperation = require('../../../queryBuilder/operations/UpdateOperation');

class ManyToManyUpdateOperationBase extends UpdateOperation {
  constructor(name, opt) {
    super(name, opt);

    this.relation = opt.relation;
    this.owner = opt.owner;

    this.hasExtraProps = false;
    this.joinTablePatch = {};
    this.joinTablePatchFilterQuery = null;
  }

  onAdd(builder, args) {
    const obj = args[0];

    // Copy all extra properties to the `joinTablePatch` object.
    for (let i = 0; i < this.relation.joinTableExtras.length; ++i) {
      const extra = this.relation.joinTableExtras[i];

      if (extra.aliasProp in obj) {
        this.hasExtraProps = true;
        this.joinTablePatch[extra.joinTableProp] = obj[extra.aliasProp];
      }
    }

    const res = super.onAdd(builder, args);

    if (this.hasExtraProps) {
      // Make sure we don't try to insert the extra properties
      // to the target table.
      this.relation.omitExtraProps([this.model]);
    }

    return res;
  }

  onAfter1(builder, result) {
    if (this.hasExtraProps) {
      const joinTableUpdateQuery = this.relation
        .getJoinModelClass(builder.knex())
        .query()
        .childQueryOf(builder)
        .patch(this.joinTablePatch);

      return this.applyModifyFilterForJoinTable(joinTableUpdateQuery).return(result);
    } else {
      return result;
    }
  }

  /* istanbul ignore next */
  applyModifyFilterForRelatedTable(builder) {
    throw new Error('not implemented');
  }

  /* istanbul ignore next */
  applyModifyFilterForJoinTable(builder) {
    throw new Error('not implemented');
  }
}

module.exports = ManyToManyUpdateOperationBase;
