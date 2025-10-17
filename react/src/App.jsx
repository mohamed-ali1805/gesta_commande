import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './Main/Main';
import Commandes from './commande/Commande';
import Add_commande from './commande/Add_commande';
import Product from './Product/Poduct';
import Edit_commande from './commande/Edit_commande';
function App() {
  return (


    <Router >
     
      <Routes>
        
        <Route path="/" element={<Main />} />
       <Route path="/commandes" element={<Commandes />} />
       <Route path="/add_commande" element={<Add_commande />} />
       <Route path="/edit_commande/:id" element={<Edit_commande />} />
       <Route path="/product" element={<Product />} />
      </Routes>



    </Router>



  );
}

export default App;
