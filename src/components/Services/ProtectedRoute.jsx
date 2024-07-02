import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { auth } from '../../firebaseConfig/firebase';

export const ProtectedRoute = ({ component: Component, ...rest }) => {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Route
      {...rest}
      render={(props) => {
        return user ? <Component {...props} /> : <Redirect to="/login" />;
      }}
    />
  );
};
