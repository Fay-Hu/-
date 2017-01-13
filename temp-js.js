const component = {
  template: model => `
	  <div class="searcher">
	      <input type="text" value="${model.selected.value}" placeholder="please input"/>
	      <ul class="list">
	      ${model.items.map(item => `
	        <li class="item">${item.value}</li>
        `).join('')}
	      </ul>
	  </div>
	`,
  style: `
	  .list{
	    background:black;
	    padding:0;
	  }
	  .item{
	    margin:0;
	    padding:.5em;
	    background:#36bd9c;
	    list-style:none;
	    color:white;
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

const inputs = {
  model: 'data-model'
};

class Searcher extends HTMLElement {
  constructor() {
    super();

    this.$shadowRoot = this.attachShadow({mode: 'closed'});
    this.model = this.getAttribute(inputs.model) || {
        selected: {
          value: 'red'
        },
        items: [{
          value: 'blue'
        }, {
          value: 'yellow'
        }]
      };
    this.render()._observer();
  }

  render() {
    this.$shadowRoot.innerHTML = '<style>' + component.style + '</style>' + component.template(this.model);
    return this;
  }

  _observer() {
    new MutationObserver(this._filter.bind(this))
      .observe(this.$shadowRoot.querySelector('input'),{
        characterData: true,
        attributes: true
      });
  }

  _filter(){
    console.log(arguments)
  }
}

customElements.define(component.selector, Searcher);

