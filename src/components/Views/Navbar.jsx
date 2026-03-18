import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Container, Button, Nav, Navbar, Badge, Offcanvas, Stack } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../Services/UserContext';
import { db } from '/src/firebaseConfig/firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faHome, faUserFriends, faPhoneAlt, faShieldAlt, faUsersCog, faSignOutAlt, faCalendarAlt, faBullhorn} from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from 'react-responsive';

export const NavbarComponent = () => {
  const { userData, setUserData } = useContext(UserContext);
  const [newMessages, setNewMessages] = useState(0);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 991 });
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userData');
    setUserData(null);
    navigate('/login');
  };

  const playSound = useCallback((source) => {
    const audioSrc = source === 'alerta' ? '/Sound/siren.mp3' : '/Sound/mensaje.mp3';
    new Audio(audioSrc).play().catch(e => console.log("Audio play blocked"));
  }, []);

  // SISTEMA DE MENSAJERÍA: Escucha mensajes no leídos
  useEffect(() => {
    if (userData?.manzana && userData?.lote) {
      const q = query(
        collection(db, 'mensajes'),
        where('receiver', '==', `${userData.manzana}-${userData.lote}`),
        where('read', '==', false)
      );
      return onSnapshot(q, (snapshot) => {
        setNewMessages(snapshot.size);
        if (!snapshot.empty) playSound('mensaje');
      });
    }
  }, [userData, playSound]);

  const NavItem = ({ to, icon, text, badge, onClick }) => (
    <Nav.Link 
      as={Link} 
      to={to} 
      className="d-flex align-items-center py-2 px-3" 
      onClick={() => {
        if (onClick) onClick();
        setShowOffcanvas(false);
      }}
    >
      <div className="position-relative me-2">
        <FontAwesomeIcon icon={icon} />
        {badge > 0 && (
          <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.6rem' }}>
            {badge}
          </Badge>
        )}
      </div>
      <span>{text}</span>
    </Nav.Link>
  );

  // Si no hay usuario o no tiene rol definido, no mostramos el menú de navegación
  if (!userData || !userData.rol) return null;

  const { rol } = userData;

  return (
    <Navbar bg="primary" variant="dark" expand="lg" fixed="top" className="shadow-sm">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
          <FontAwesomeIcon icon={faEnvelope} className="me-2" />
          <span>CUBE</span>
          {!isMobile && <span className="ms-2 small fw-normal">| {userData.nombre}</span>}
        </Navbar.Brand>
        
        <Navbar.Toggle onClick={() => setShowOffcanvas(true)} />

        <Navbar.Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)} placement="end">
          <Offcanvas.Header closeButton className="bg-light">
            <Offcanvas.Title>Menú de {userData.nombre}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="justify-content-end flex-grow-1 pe-3">
              
              {/* ACCESOS PARA TODOS LOS LOGUEADOS */}
              {(rol.administrador || rol.propietario || rol.inquilino || rol.seguridad) && (
                <>
              <NavItem to="/novedades" icon={faHome} text="Inicio" />
              <NavItem to="/panico" icon={faBullhorn} text="Alertas" />
              <NavItem to="/mensajeria" icon={faEnvelope} text="Mensajes" badge={newMessages} />
                </>
               )}

              {/* PERMISOS: PROPIETARIOS  */}
              {(rol.administrador || rol.propietario ) && (
                <>
                  <NavItem to="/alquileres" icon={faCalendarAlt} text="Alquileres" />
                  
                </>
              )}
              {/* PERMISOS: PROPIETARIOS / INQUILINOS */}
              {(rol.administrador || rol.propietario || rol.inquilino) && (
                <>
                   <NavItem to="/invitados" icon={faUserFriends} text="Invitados" />
                  <NavItem to="/contacto" icon={faPhoneAlt} text="Contacto" />
                </>
              )}


              {/* PERMISOS: ADMINISTRACIÓN */}
              {rol.administrador && (
                <>
                  <NavItem to="/reservas" icon={faCalendarAlt} text="Reservas" />
                  <NavItem to="/administracion" icon={faUsersCog} text="Panel Admin" />
                  <NavItem to="/campanas" icon={faBullhorn} text="Campañas" />
                </>
              )}

              {/* PERMISOS: SEGURIDAD / GUARDIA */}
              {(rol.administrador || rol.seguridad) && (
                <NavItem to="/seguridad" icon={faShieldAlt} text="Guardia" />
              )}

              <hr className="d-lg-none" />
              <Button variant="outline-danger" onClick={handleLogout} className="mt-2 mt-lg-0 ms-lg-3 fw-bold">
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> SALIR
              </Button>
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};