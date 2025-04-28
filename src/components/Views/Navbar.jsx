import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Container, Button, Nav, Navbar, Badge, Offcanvas } from 'react-bootstrap';
import { UserContext } from '../Services/UserContext';
import { db } from '/src/firebaseConfig/firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faHome, 
  faCalendarAlt, 
  faUserFriends, 
  faBell, 
  faPhoneAlt, 
  faShieldAlt,
  faUsersCog,
  faBullhorn,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from 'react-responsive';

export const NavbarComponent = ({ handleLogout }) => {
  const { userData } = useContext(UserContext);
  const [newMessages, setNewMessages] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 992 });
  const isSmallMobile = useMediaQuery({ maxWidth: 576 });

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

  const handleCloseMobileMenu = () => setShowMobileMenu(false);
  const handleShowMobileMenu = () => setShowMobileMenu(true);

  const NavItem = ({ href, icon, text, showBadge = false, badgeCount = 0 }) => (
    <Nav.Link 
      href={href} 
      className="d-flex align-items-center py-2 px-3"
      onClick={handleCloseMobileMenu}
    >
      <FontAwesomeIcon icon={icon} className="me-2" style={{ width: '1.25rem' }} />
      <span>{text}</span>
      {showBadge && badgeCount > 0 && (
        <Badge pill bg="danger" className="ms-2">
          {badgeCount}
        </Badge>
      )}
    </Nav.Link>
  );

  return (
    <>
      <Navbar 
        bg="primary" 
        variant="dark" 
        expand="lg" 
        fixed="top" 
        className="shadow-sm"
        collapseOnSelect
      >
        <Container fluid>
          {/* Logo section */}
          <Navbar.Brand href="#/panico" className="d-flex align-items-center">
            <div className="d-flex align-items-center me-2">
              <FontAwesomeIcon 
                icon={faEnvelope} 
                className={`${isSmallMobile ? 'fs-5' : 'fs-4'} position-relative`}
              />
              {newMessages > 0 && (
                <Badge 
                  pill 
                  bg="danger" 
                  className="position-absolute translate-middle"
                  style={{ top: '5px', left: '15px', fontSize: '0.6rem' }}
                >
                  {newMessages}
                </Badge>
              )}
            </div>
            <span className={`${isSmallMobile ? 'fs-6' : 'fs-5'} fw-bold`}>CUBE</span>
            {userData?.nombre && !isMobile && (
              <span className="ms-2 d-none d-lg-inline">
                | ¡Hola <em>{userData.nombre}</em>!
              </span>
            )}
          </Navbar.Brand>

          {/* Mobile menu toggle */}
          <Navbar.Toggle 
            aria-controls="offcanvas-navbar" 
            onClick={handleShowMobileMenu}
            className="border-0"
          >
            <span className="navbar-toggler-icon"></span>
          </Navbar.Toggle>

          {/* Desktop menu */}
          {!isMobile && (
            <Navbar.Collapse id="navbar-desktop" className="justify-content-between">

            <Nav className="flex-grow-1">
              {userData?.rol && (
                <>
                  {(userData.rol.administrador || userData.rol.guardia) && (
                    <NavItem 
                      href="#/seguridad" 
                      icon={faShieldAlt} 
                      text="Seguridad" 
                    />
                  )}

                  {(userData.rol.propietario || userData.rol.inquilino || userData.rol.administrador) && (
                    <>
                      <NavItem href="#/panico" icon={faHome} text="Inicio" />
                      <NavItem href="#/reservas/create" icon={faCalendarAlt} text="Reservar" />
                      <NavItem href="#/invitados" icon={faUserFriends} text="Invitados" />
                      <NavItem 
                        href="#/mensajeria" 
                        icon={faEnvelope} 
                        text="Mensajes" 
                        showBadge 
                        badgeCount={newMessages}
                      />
                      <NavItem href="#/novedades" icon={faBell} text="Novedades" />
                      <NavItem href="#/contacto" icon={faPhoneAlt} text="Contacto" />
                    </>
                  )}

                  {userData.rol.administrador && (
                    <>
                      <NavItem href="#/administracion" icon={faUsersCog} text="Administración" />
                      <NavItem href="#/campanas" icon={faBullhorn} text="Campañas" />
                    </>
                  )}
                </>
              )}
            </Nav>

            <Nav>
              {userData?.nombre && (
                <Button 
                  variant="outline-light" 
                  onClick={handleLogout}
                  className="d-flex align-items-center ms-lg-3"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                  <span>Salir</span>
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
          )}
        </Container>
      </Navbar>

      {/* Mobile menu offcanvas */}
      <Offcanvas 
        show={showMobileMenu} 
        onHide={handleCloseMobileMenu} 
        placement="end"
        className="w-75"
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>
            {userData?.nombre ? (
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                {newMessages > 0 && (
                  <Badge pill bg="danger" className="ms-1">
                    {newMessages}
                  </Badge>
                )}
                <span className="ms-2">¡Hola {userData.nombre}!</span>
              </div>
            ) : (
              'Menú'
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column">
            {userData?.rol && (
              <>
                {(userData.rol.administrador || userData.rol.guardia) && (
                  <NavItem 
                    href="#/seguridad" 
                    icon={faShieldAlt} 
                    text="Seguridad" 
                  />
                )}

                {(userData.rol.propietario || userData.rol.inquilino || userData.rol.administrador) && (
                  <>
                    <NavItem href="#/panico" icon={faHome} text="Inicio" />
                    <NavItem href="#/reservas/create" icon={faCalendarAlt} text="Reservar" />
                    <NavItem href="#/invitados" icon={faUserFriends} text="Invitados" />
                    <NavItem 
                      href="#/mensajeria" 
                      icon={faEnvelope} 
                      text="Mensajes" 
                      showBadge 
                      badgeCount={newMessages}
                    />
                    <NavItem href="#/novedades" icon={faBell} text="Novedades" />
                    <NavItem href="#/contacto" icon={faPhoneAlt} text="Contacto" />
                  </>
                )}

                {userData.rol.administrador && (
                  <>
                    <NavItem href="#/administracion" icon={faUsersCog} text="Administración" />
                    <NavItem href="#/campanas" icon={faBullhorn} text="Campañas" />
                  </>
                )}

                <div className="border-top mt-2 pt-2">
                  <NavItem 
                    href="/" 
                    icon={faSignOutAlt} 
                    text="Cerrar sesión" 
                    onClick={handleLogout}
                  />
                </div>
              </>
            )}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};