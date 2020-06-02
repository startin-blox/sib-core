describe('Backward Compatibility of sib elements test', function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/sib-backward-compatibility.html');
  });
  it('check sub tags', () => {
    cy.get('#solid-form, #sib-form, #solid-display, #sib-display').then(elms => {
      elms.each((_, elm) => {
        const isSib = elm.localName.startsWith('sib-');
        elm.addEventListener('populate',() => {
          const childrenTags = [...new Set(elm.querySelectorAll("*"))]
            .map((elm) => elm.localName)
            .filter((tag) => tag.includes('-'));
          const solidChildren = childrenTags.filter(tag => tag.startsWith('solid-'));
          const sibChildren = childrenTags.filter(tag => tag.startsWith('sib-'));

          if (isSib) {
            expect(sibChildren).is.not.empty;
            expect(solidChildren).is.empty;
          } else {
            expect(solidChildren).is.not.empty;
            expect(sibChildren).is.empty;
          }
        })
      });
    })
  });
});
