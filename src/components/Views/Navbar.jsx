import React, { useContext, useEffect, useState, useCallback } from 'react';
import {Container,  Button,  Nav,  Navbar,  Badge,  Offcanvas, Stack} from 'react-bootstrap';
import { UserContext } from '../Services/UserContext';
import { db } from '/src/firebaseConfig/firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faEnvelope, faHome, faCalendarAlt, faUserFriends, faBell, faPhoneAlt, faShieldAlt, faUsersCog, faBullhorn, faSignOutAlt, faBars} from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from 'react-responsive';

export const NavbarComponent = ({ handleLogout }) => {
  const { userData } = useContext(UserContext);
  const [newMessages, setNewMessages] = useState(0);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const isWideScreen = useMediaQuery({ minWidth: 1200 });
  const isMediumScreen = useMediaQuery({ minWidth: 992, maxWidth: 1199 });
  const isMobile = useMediaQuery({ maxWidth: 991 });

  const playSound = useCallback((source) => {
    const audioSrc = source === 'alerta' ? '/public/Sound/siren.mp3' : '/public/Sound/mensaje.mp3';
    const audio = new Audio(audioSrc);
    audio.play();
  }, []);

  useEffect(() => {
    if (userData && userData.manzana && userData.lote) {
      const socioNumber = `${userData.manzana}-${userData.lote}`;
      const q = query(
        collection(db, 'mensajes'),
        where('receiver', '==', socioNumber),
        where('read', '==', false)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setNewMessages(querySnapshot.size);

        if (querySnapshot.size > 0) {
          querySnapshot.forEach(doc => {
            const data = doc.data();
            playSound(data.source);
          });
        }
      });

      return () => unsubscribe();
    }
  }, [userData, playSound]);

  const toggleOffcanvas = () => setShowOffcanvas(!showOffcanvas);

  const NavItem = ({ href, icon, text, showBadge = false, badgeCount = 0, onClick }) => (
    <Nav.Link 
      href={href} 
      className="d-flex align-items-center py-2 px-2 mx-1"
      onClick={onClick}
    >
      <FontAwesomeIcon icon={icon} className="me-2" />
      <span>{text}</span>
      {showBadge && badgeCount > 0 && (
        <Badge pill bg="danger" className="ms-2">
          {badgeCount}
        </Badge>
      )}
    </Nav.Link>
  );

  const renderNavItems = (onItemClick = () => {}) => {
    if (!userData?.rol) return null;

    return (
      <>
        {(userData.rol.administrador || userData.rol.guardia) && (
          <NavItem 
            href="#/seguridad" 
            icon={faShieldAlt} 
            text="Seguridad" 
            onClick={onItemClick}
          />
        )}

        {(userData.rol.propietario || userData.rol.inquilino || userData.rol.administrador) && (
          <>
            <NavItem href="#/panico" icon={faHome} text="Inicio" onClick={onItemClick} />
            <NavItem href="#/reservas/create" icon={faCalendarAlt} text="Reservar" onClick={onItemClick} />
            <NavItem href="#/invitados" icon={faUserFriends} text="Invitados" onClick={onItemClick} />
            <NavItem 
              href="#/mensajeria" 
              icon={faEnvelope} 
              text="Mensajes" 
              showBadge 
              badgeCount={newMessages}
              onClick={onItemClick}
            />
            <NavItem href="#/novedades" icon={faBell} text="Novedades" onClick={onItemClick} />
            <NavItem href="#/alquileres" icon={faHome} text="Alquileres" onClick={onItemClick} />
            <NavItem href="#/contacto" icon={faPhoneAlt} text="Contacto" onClick={onItemClick} />
          </>
        )}

        {userData.rol.administrador && (
          <>
            <NavItem href="#/administracion" icon={faUsersCog} text="Administración" onClick={onItemClick} />
            <NavItem href="#/campanas" icon={faBullhorn} text="Campañas" onClick={onItemClick} />
          </>
        )}
      </>
    );
  };

  const renderDesktopNavbar = () => (
    <Navbar.Collapse id="navbar-desktop">
      <Nav className="me-auto">
        <Stack direction="horizontal" gap={1}>
          {renderNavItems()}
        </Stack>
      </Nav>
      <Nav>
        {userData?.nombre && (
          <Button 
            variant="outline-light" 
            onClick={handleLogout}
            className="d-flex align-items-center ms-2"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
            Salir
          </Button>
        )}
      </Nav>
    </Navbar.Collapse>
  );

  const renderMobileNavbar = () => (
    <>
      <Navbar.Toggle 
        aria-controls="offcanvas-navbar" 
        onClick={toggleOffcanvas}
        className="border-0"
      >
        <FontAwesomeIcon icon={faBars} />
        {newMessages > 0 && (
          <Badge pill bg="danger" className="ms-1">
            {newMessages}
          </Badge>
        )}
      </Navbar.Toggle>

      <Offcanvas 
        show={showOffcanvas} 
        onHide={toggleOffcanvas} 
        placement="end"
        className="w-75"
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>
            {userData?.nombre ? `¡Hola ${userData.nombre}!` : 'Menú'}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column">
            {renderNavItems(toggleOffcanvas)}
            {userData?.nombre && (
              <div className="border-top mt-2 pt-2">
                <NavItem 
                  href="/" 
                  icon={faSignOutAlt} 
                  text="Cerrar sesión" 
                  onClick={() => {
                    toggleOffcanvas();
                    handleLogout();
                  }}
                />
              </div>
            )}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );

  return (
    <Navbar 
      bg="primary" 
      variant="dark" 
      expand="lg" 
      fixed="top" 
      className="shadow-sm"
      collapseOnSelect
    >
      <Container fluid>
        <Navbar.Brand href="#/panico" className="responsive d-flex align-items-center me-3">
          <div className="position-relative">
            <FontAwesomeIcon icon={faEnvelope} />
            {newMessages > 0 && (
              <Badge 
                pill 
                bg="danger" 
                className="position-absolute top-0 start-100 translate-middle"
                style={{ fontSize: '0.6rem' }}
              >
                {newMessages}
              </Badge>
            )}
          </div>
          <span className="fw-bold ms-2">CUBE</span>
          {userData?.nombre && isWideScreen && (
            <span className="ms-2">| ¡Hola {userData.nombre}!</span>
          )}
        </Navbar.Brand>

        {isMobile ? renderMobileNavbar() : renderDesktopNavbar()}
      </Container>
    </Navbar>
  );
};