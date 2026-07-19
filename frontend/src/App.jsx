import {Routes, Route, Navigate} from 'react-router-dom';
import {useAuth} from './AuthContext.jsx';
import Login from './Login.jsx';
import Index from './Index.jsx';
import Register from './Register.jsx';
//Routes / Route — React Router's way of saying "when the URL is X, show component Y"

//ProtectedRoute — a small wrapper component: it checks if a token exists in our shared AuthContext. If yes, it renders whatever's inside it (Index). 
// If no, it redirects to /login using <Navigate> — this is exactly the "can't view the dashboard without logging in" protection
function ProtectedRoute({children}){
  const {token} = useAuth();
  return token ? children : <Navigate to="/login" />
}

//Added <Route path="/register" element={<Register />} /> — a public route, no ProtectedRoute wrapper needed, since anyone (not-yet-logged-in users) needs to reach this page

function App(){
  return(
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route
      path="/" 
      element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      }
      />
    </Routes>
  )
}

export default App;