export default const Loader = {
  get computed() {
    get loading() {
      return this.getAttribute('sib-loading');
    }

    set loading(value) {
      if (value) {
        this.setAttribute('sib-loading', true);
      } else {
        this.setAttribute('sib-loading', false);
      }
    }
  }
}
