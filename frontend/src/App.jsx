import {Routes, Route, Navigate} from 'react-router-dom';
import {useAuth} from './AuthContext.jsx';
import Login from './Login.jsx';
import Index from './Index.jsx';
import Register from './Register.jsx';
import TicketList from './TicketList.jsx';
import CreateTicket from './CreateTicket.jsx';
import TicketDetails from './TicketDetails.jsx';
import NotificationBell from './NotificationBell.jsx';

function ProtectedRoute({children}){
  const {token} = useAuth();
  if(!token) return <Navigate to="/login"/>

  return(
    <>
      <NotificationBell />
      {children}
    </>
  );
}

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
    </Routes>
  )
}

export default App;