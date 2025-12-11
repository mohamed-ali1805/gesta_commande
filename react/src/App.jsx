import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './Main/Main';
import Commandes from './commande/Commande';
import Add_commande from './commande/Add_commande';
import Product from './Product/Poduct';
import Edit_commande from './commande/Edit_commande';
import Achats from './Achat/Achat';
import Add_achat from './Achat/Add_achat';
import Edit_achat from './Achat/Edit_Achat';
function App() {
  return (


    <Router >
     
      <Routes>
        
        <Route path="/" element={<Main />} />
       <Route path="/commandes" element={<Commandes />} />
       <Route path="/add_commande" element={<Add_commande />} />
       <Route path="/edit_commande/:id" element={<Edit_commande />} />
        <Route path="/achats" element={<Achats />} />
        <Route path="/add_achat" element={<Add_achat />} />
        <Route path="/edit_achat/:id" element={<Edit_achat />} />
       <Route path="/product" element={<Product />} />
      </Routes>



    </Router>



  );
}

export default App;
