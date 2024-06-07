import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import Image from 'react-bootstrap/Image';
export const Panico = () => {
  const [userData, setUserData] = useState(null);
  const [usuariosMismaManzana, setUsuariosMismaManzana] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const obtenerDatosUsuario = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const db = getFirestore();
          const usuarioDocRef = doc(db, 'usuarios', user.uid);
          const usuarioDocSnap = await getDoc(usuarioDocRef);

          if (usuarioDocSnap.exists()) {
            const userData = usuarioDocSnap.data();
            setUserData(userData);

            // Obtener todos los usuarios de la misma manzana
            const usuariosCollection = collection(db, 'usuarios');
            const usuariosSnapshot = await getDocs(usuariosCollection);
            const usuariosMismaManzana = usuariosSnapshot.docs
              .filter((doc) => doc.data().manzana === userData.manzana)
              .map((doc) => doc.data().numerotelefono);

            setUsuariosMismaManzana(usuariosMismaManzana);
          } else {
            console.log('No se encontraron datos del usuario en Firestore');
          }
        } else {
          console.log('No hay usuario autenticado');
        }
      } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Verificar si hay un usuario autenticado antes de obtener sus datos
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      obtenerDatosUsuario();
    } else {
      setIsLoading(false);
    }
  }, []);

  const alerta = () => {
    if (isLoading) {
      return <div>Cargando...</div>;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitud = position.coords.latitude;
          const longitud = position.coords.longitude;
          const mensaje = `Soy del lote ${userData?.lote}, en la manzana ${userData?.manzana} y escucho ruidos sospechosos por acá: ${latitud}, ${longitud}`;
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${userData?.numerotelefono}&text=${encodeURIComponent(mensaje)}`;
          window.location.href = whatsappUrl;
        },
        (error) => {
          console.log('Error al obtener la ubicación:', error);
        }
      );
    } else {
      console.log('Geolocalización no es compatible con este navegador.');
    }
  };

  const ruidos = () => {
    if (isLoading) {
      return <div>Cargando...</div>;
    }

    if (typeof navigator !== 'undefined' && navigator !== null && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitud = position.coords.latitude;
          const longitud = position.coords.longitude;
          const mensaje = `Soy del lote ${userData?.lote} y escucho ruidos sospechosos por acá: ${latitud}, ${longitud}`;
          // Enviar mensaje a todos los usuarios de la misma manzana
          usuariosMismaManzana.forEach((telefono) => {
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
            window.open(whatsappUrl);
          });
        },
        (error) => {
          console.log('Error al obtener la ubicación:', error);
        }
      );
    } else {
      console.log('Geolocalización no es compatible con este navegador.');
    }
  };

  const llamar911 = () => {
    const numeroEmergencia = '911';
    const llamadaUrl = `tel:${numeroEmergencia}`;
    window.open(llamadaUrl);
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <main className="container fluid">
      <div className="container alertas">
        <div className="row justify-content-center">
          <div className="col col-12 col-sm-4 gx-4">
            <div className="card">
              <Image
                src={"/img/seguridadAlerta.png"} 
                height="0.5%"
                className="card-img-top"
                alt="imagen de la guardia"
                onClick={alerta}
                roundedCircle
                fluid={true}
              />
              <div className="card-body">
                <h5 className="card-title">ALERTA</h5>
                <p className="card-text">Avisar a la guardia</p>
                <button
                  type="button"
                  value="alerta"
                  className="btn btn-danger"
                  onClick={alerta}
                >
                  ALERTA
                </button>
              </div>
            </div>
          </div>

          <div className="col col-12 col-sm-4 gx-4">
            <div className="card">
              <Image
                src={"/img/vecinosAlerta.png"}
                height="0.5%"
                sizes='mg'
                className="card-img-top"
                alt="imagen de los vecinos de la isla"
                onClick={ruidos}
                roundedCircle
                />
              <div className="card-body">
                <h5 className="card-title">RUIDOS</h5>
                <p className="card-text">Avisar a los vecinos de la isla</p>
                <button
                  type="button"
                  value="ruidos"
                  className="btn btn-warning"
                  onClick={ruidos}
                  >
                  RUIDOS
                </button>
              </div>
            </div>
          </div>

          <div className="col col-12 col-sm-4  gx-4">
            <div className="card">
              <Image
                src={"/img/911.png"}
                height="0.5%"
                className="card-img-top"
                alt="imagen de la guardia"
                onClick={llamar911}
                roundedCircle
              />
              <div className="card-body">
                <h5 className="card-title">EMERGENCIA</h5>
                <p className="card-text">Llamar al 911</p>
                <button
                  type="button"
                  value="ayuda"
                  className="btn btn-primary"
                  onClick={llamar911}
                  >
                  911
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};