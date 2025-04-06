console.debug("Loading Root view");

window.Root = (store, actions) => (
<div className="container">
  <div className="row">
    <div className="col-6">
      <h2 className="pt-2">{store.title}</h2>
    </div>
  </div>
  <div className="row">
    <div className="col-6">
      <span>status = {store.button.status?"TRUE":"FALSE"}</span><br/>
      <button className="btn btn-outline-secondary"
      onClick={actions.buttonClicked.trigger}>
      {store.button.label}
      </button>
    </div>
  </div>
</div>
)

window.renderRoot();

console.debug("Root view loaded");
