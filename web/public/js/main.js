const { Provider } = ReactRedux;
const { BrowserRouter } = ReactRouterDOM;

// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    React.createElement(React.StrictMode, null,
      React.createElement(Provider, { store: window.store },
        React.createElement(BrowserRouter, null,
          React.createElement(window.App)
        )
      )
    )
  );
});