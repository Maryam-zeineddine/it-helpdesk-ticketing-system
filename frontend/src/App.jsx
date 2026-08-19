import {Routes, Route, Navigate} from 'react-router-dom';
import {useAuth} from './AuthContext.jsx';
import Login from './Login.jsx';
import Index from './Index.jsx';
import Register from './Register.jsx';
import TicketList from './TicketList.jsx';
import CreateTicket from './CreateTicket.jsx';
import TicketDetails from './TicketDetails.jsx';
import Reports from './Reports.jsx';
import Layout from './Layout.jsx';
import ManageUsers from './ManageUsers.jsx';

function ProtectedRoute({ children }) {
    const { token } = useAuth();
    if (!token) return <Navigate to="/login" />;

    return <Layout>{children}</Layout>;
}

function App(){
  return(
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
      path="/" 
      element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      }
      />
      <Route
      path="/tickets"
      element={
        <ProtectedRoute>
          <TicketList />
        </ProtectedRoute>
      }
      />
      <Route
      path="/tickets/new"
      element={
        <ProtectedRoute>
          <CreateTicket />
        </ProtectedRoute>
      }
      />
      <Route
      path="/tickets/:id"
      element={
        <ProtectedRoute>
          <TicketDetails />
        </ProtectedRoute>
      }
      />

      <Route
      path="/reports"
      element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      }
      />

      <Route
      path="/users"
      element={
        <ProtectedRoute>
          <ManageUsers />
        </ProtectedRoute>
      }
      />
      
    </Routes>
  )
}

export default App;