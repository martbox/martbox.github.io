console.debug("Loading Root view");

window.Root = (store, actions) => (
<div class="container">
  <div class="row">
    <div class="col-6">
      <h2 class="pt-2">{store.title}</h2>
    </div>
  </div>
  <div class="row">
    <div class="col-6">
      <span>status = {store.button.status}</span><br/>
      <button class="btn btn-outline-secondary"
      onClick={actions.buttonClicked.trigger()}>
      {store.button.label}
      </button>
    </div>
  </div>
</div>
)

window.renderRoot();

console.debug("Root view loaded");
