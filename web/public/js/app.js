// Navigation configuration
const navigation = [
  { name: 'Home', href: '/', current: true },
  { name: 'Products', href: '/products', current: false },
  { name: 'Categories', href: '/categories', current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Home Component
function Home() {
  return (
    <div className="space-y-16">
      {/* Hero section */}
      <div className="relative">
        <div className="mx-auto max-w-7xl">
          <div className="relative z-10 pt-14 lg:w-full lg:max-w-2xl">
            <div className="relative px-6 py-32 sm:py-40 lg:px-8 lg:py-56">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Shop the Latest Trends
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Discover our curated collection of products. From fashion to electronics, 
                  we have everything you need.
                </p>
                <div className="mt-10">
                  <ReactRouterDOM.Link to="/products" className="btn btn-primary">
                    Shop Now
                  </ReactRouterDOM.Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured products */}
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Products</h2>
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {/* Sample product */}
          <div className="group relative">
            <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none lg:h-80">
              <img
                src="https://tailwindui.com/img/ecommerce-images/product-page-01-related-product-01.jpg"
                alt="Sample product"
                className="h-full w-full object-cover object-center lg:h-full lg:w-full"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-sm text-gray-700">
                  <ReactRouterDOM.Link to="/products">
                    <span aria-hidden="true" className="absolute inset-0" />
                    Basic Tee
                  </ReactRouterDOM.Link>
                </h3>
                <p className="mt-1 text-sm text-gray-500">Black</p>
              </div>
              <p className="text-sm font-medium text-gray-900">$35</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Products Component
function Products() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Products</h1>
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {/* Sample product */}
          <div className="group relative">
            <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none lg:h-80">
              <img
                src="https://tailwindui.com/img/ecommerce-images/product-page-01-related-product-01.jpg"
                alt="Sample product"
                className="h-full w-full object-cover object-center lg:h-full lg:w-full"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-sm text-gray-700">Basic Tee</h3>
                <p className="mt-1 text-sm text-gray-500">Black</p>
              </div>
              <p className="text-sm font-medium text-gray-900">$35</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Categories Component
function Categories() {
  const categories = [
    {
      name: 'Electronics',
      href: '/products?category=electronics',
      imageSrc: 'https://tailwindui.com/img/ecommerce-images/home-page-02-edition-01.jpg',
      description: 'Shop the latest electronics, from smartphones to laptops.',
    },
    {
      name: 'Clothing',
      href: '/products?category=clothing',
      imageSrc: 'https://tailwindui.com/img/ecommerce-images/category-page-02-image-card-01.jpg',
      description: 'Discover the latest fashion trends for all seasons.',
    },
  ];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <h1 className="text-4xl font-bold text-gray-900">Categories</h1>
          <div className="mt-6 space-y-12 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:space-y-0">
            {categories.map((category) => (
              <div key={category.name} className="group relative">
                <div className="relative h-80 w-full overflow-hidden rounded-lg bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-64">
                  <img
                    src={category.imageSrc}
                    alt={category.name}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-gray-900">
                  <ReactRouterDOM.Link to={category.href}>
                    <span className="absolute inset-0" />
                    {category.name}
                  </ReactRouterDOM.Link>
                </h3>
                <p className="mt-2 text-base text-gray-500">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// App Component
function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container">
          <div className="relative flex h-16 items-center justify-between">
            {/* Mobile menu button */}
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Logo and navigation */}
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold text-primary">LogiShop</span>
              </div>
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4">
                  {navigation.map((item) => (
                    <ReactRouterDOM.Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        item.current
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100',
                        'rounded-md px-3 py-2 text-sm font-medium'
                      )}
                    >
                      {item.name}
                    </ReactRouterDOM.Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Shopping cart */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <button type="button" className="btn btn-secondary">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="sr-only">View shopping cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navigation.map((item) => (
              <ReactRouterDOM.Link
                key={item.name}
                to={item.href}
                className={classNames(
                  item.current
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100',
                  'block rounded-md px-3 py-2 text-base font-medium'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </ReactRouterDOM.Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route path="/" element={<Home />} />
          <ReactRouterDOM.Route path="/products" element={<Products />} />
          <ReactRouterDOM.Route path="/categories" element={<Categories />} />
        </ReactRouterDOM.Routes>
      </main>
    </div>
  );
}

// Initialize the app
ReactDOM.render(
  <React.StrictMode>
    <ReactRouterDOM.BrowserRouter>
      <App />
    </ReactRouterDOM.BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);