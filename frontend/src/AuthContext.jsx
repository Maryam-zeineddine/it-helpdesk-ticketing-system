import { createContext, useContext, useState} from 'react';

//creates a "box" that can hold shared data, starting empty
const AuthContext = createContext(null);

//AuthProvider — a wrapper component; anything placed inside it can access the shared token/user data
export function AuthProvider({children})
{
    //token / user state — holds the JWT string and the logged-in user's info (name, email, roleId) once they log in
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);

    //login(newToken, newUser) — a function pages will call after a successful /api/login response, to actually store the token/user in this shared state
    const login = (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
    }

    //logout() — clears everything, used when logging out
    const logout = () => {
        setToken(null);
        setUser(null);
    }

    return(
        <AuthContext.Provider value= {{token, user, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

//useAuth() — a custom hook that allows any page to access the shared token/user data and login/logout functions
export function useAuth(){
    return useContext(AuthContext);
}