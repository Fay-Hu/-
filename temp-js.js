const component = {
  template: model => `
	  <div class="searcher">
	      <input type="text" value="${model.filter}" placeholder="${model.placeHolder}"/>
	      <ul class="list">
	  ${model.items.map(item => ~item.text.search(model.filter) ? `
          <li class="item">${item.text}</li>`
    : '').join('')}
	      </ul>
	  </div>
	`,
  style: `
    .list{
      padding:0;
      background:black;
    }
    .item{
      margin:0;
      padding:.5em;
      color:white;
      background:#36bd9c;
      list-style:none;   
    }
    .item:hover{
      background:#239bc8;
    }
    input{
      height: 30px;
      padding: .3em;
    }
    input:focus{
      border-color:transparent;
      outline:none;
      box-shadow:0 0 1px 2px #239bc8;
    }
	`,
  selector: 'x-searcher'
};

class Searcher extends HTMLElement {
  constructor() {
    super();

    this.$shadowRoot = this.attachShadow({mode: 'closed'});
    this.model = {
      filter: '',
      placeHolder: 'please input keywords',
      items: [{
        value: '01',
        text: 'blue'
      }, {
        value: '02',
        text: 'yellow'
      }, {
        value: '03',
        text: 'red'
      }]
    };
    this.render();
  }

  render() {
    this.$shadowRoot.innerHTML = '<style>' + component.style + '</style>' + component.template(this.model);
    this.$input = this.$shadowRoot.querySelector('input');
    this.$input.focus();

    return this._observer()._proxy();
  }

  _observer() {
    this.$input.addEventListener('input', (e) => {
      e.target.setAttribute('value', this.model.filter = e.target.value);
    });

    new MutationObserver(this.render.bind(this))
      .observe(this.$input, {
        attributes: true
      });

    return this;
  }

  _proxy() {
    let _this = this;
    this.model = new Proxy(this.model, {
      set(target, key, value, proxy){
        Reflect.set(target, key, value, proxy);
        _this.render.call(_this);
      }
    });

    return this;
  }
}

customElements.define(component.selector, Searcher);

