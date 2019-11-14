import {
  uniqID,
  /*stringToDom,
  setDeepProperty,
  parseFieldsString,
  findClosingBracketMatchIndex,
  evalTemplateString,
  importCSS,
  importJS,
  defineComponent,*/
} from '../../../src/libs/helpers';

describe('uniqID', function() {
  it('check true === false', () => {
    expect(true).to.equal(false);
  });
  
  it('returns an id', () => {
    let test = uniqID();
    expect(test).to.match(/[_].{10}/g);
  });

  it('returns a different id 50 times in a row', () => {
    let ids = [];
    const arraySize = 50;
    for (let index = 0; index < arraySize; index++) {
      ids.push(uniqID());
    }
    let noDuplicates = [...new Set(ids)];
    expect(noDuplicates.length).to.equal(arraySize);
  });
});
