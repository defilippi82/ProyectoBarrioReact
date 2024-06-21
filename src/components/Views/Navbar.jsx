import React, { useContext, useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { UserContext } from '../Services/UserContext';
import { db } from '/src/firebaseConfig/firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';


export const NavbarComponent = ({ handleLogout }) => {
  const { userData } = useContext(UserContext);
  const [newMessages, setNewMessages] = useState(0);

  useEffect(() => {
    if (userData && userData.nombre) {
      const q = query(
        collection(db, 'mensajes'),
        where('receiver', '==', userData.nombre),
        where('read', '==', false)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setNewMessages(querySnapshot.size);
      });

      return () => unsubscribe();
    }
  }, [userData]);

  return (
    <Navbar collapseOnSelect bg="primary" data-bs-theme="primary" expand="lg" fixed='top' >
      <Container fluid>
        <Navbar.Brand href="/#/panico" >
            <Nav.Link className="d-inline-block align-top" href="#/mensajeria">
              <FontAwesomeIcon icon={faEnvelope} />
              {newMessages > 0 && (
                <span className="badge bg-danger text-white ms-1">{newMessages}</span>
              )}
            </Nav.Link>
          <strong>SafeNeighborhood App ||</strong>
          {userData && userData.nombre && <span className="user-name">¡Hola <em>{userData.nombre}!</em></span>}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {userData && userData.nombre && (
              <>
                <Nav.Link className="navlinks" href="#/panico">
                  Inicio
                </Nav.Link>
                <Nav.Link className="navlinks" href="#/reservas/create">
                  Reservar
                </Nav.Link>
                <Nav.Link className="navlinks" href="#/invitados">
                  Invitados
                </Nav.Link>
                <Nav.Link className="navlinks" href="#/novedades">
                  Novedades
                </Nav.Link>
                <Nav.Link className="navlinks" href="#/contacto">
                  Contacto
                </Nav.Link>
                {userData.rol && userData.rol.administrador && (
                  <Nav.Link className="navlinks" href="#/administracion">
                    Administración
                  </Nav.Link>
                )}
                <Button variant="outline-danger" size='sm' href="/" onClick={handleLogout} className="logout-button">
                  Salir
                </Button>
              </>
            )}
          </Nav>
          <Nav className="ms-auto">
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
