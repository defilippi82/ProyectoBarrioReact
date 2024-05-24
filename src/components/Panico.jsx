import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';



export const Panico = () => {
  
  const [lote, setLote] = useState(''); // Ejemplo de lote, puede ser dinámico
  const [manzana, setManzana] = useState(''); // Ejemplo de manzana, puede ser dinámico
  const [telefono, setTelefono] = useState(''); // Número de teléfono de contacto
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
            setLote(userData.lote);
            setManzana(userData.manzana);
            setTelefono(userData.numerotelefono);
          } else {
            console.log('No se encontraron datos del usuario en Firestore');
          }
        } else {
          console.log('No hay usuario autenticado');
        }
      } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
      } finally {
        setIsLoading(false); // Marcar que la carga ha terminado
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

  if (isLoading) {
    return <div>Loading...</div>; // O cualquier spinner de carga que prefieras
  }

  const alerta = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitud = position.coords.latitude;
          const longitud = position.coords.longitude;
          const mensaje = `Soy del lote ${lote}, en la manzana ${manzana} y escucho ruidos sospechosos por acá: ${latitud}, ${longitud}`;
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
          window.location.href = whatsappUrl;
        },
        (error) => {
          console.log("Error al obtener la ubicación:", error);
        }
      );
    } else {
      console.log("Geolocalización no es compatible con este navegador.");
    }
  };

  const ruidos = () => {
    if (typeof navigator !== 'undefined' && navigator !== null && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitud = position.coords.latitude;
          const longitud = position.coords.longitude;
          const mensaje = `Soy del lote ${lote} y escucho ruidos sospechosos por acá: ${latitud}, ${longitud}`;
          // Número de teléfono de los contactos de la isla
          const telefonoisla = '+54911549394232';
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
          window.open(whatsappUrl);
        },
        (error) => {
          console.log("Error al obtener la ubicación:", error);
        }
      );
    } else {
      console.log("Geolocalización no es compatible con este navegador.");
    }
  };
  const llamar911 = () => {
    const numeroEmergencia = '911';
    const llamadaUrl = `tel:${numeroEmergencia}`;
    window.open(llamadaUrl);
  };
  if (isLoading) {
    return <div>Loading...</div>; // O cualquier spinner de carga que prefieras
  }

  return (
    <main className="container">
      <div className="container alertas">
        <div className="row justify-content-center">
          <div className="col col-12 col-sm-6 col-lg-4 gx-4">
            <div className="card">
              <img
                src="../img/seguridadAlerta.png "
                height="0.5%"
                className="card-img-top"
                alt="imagen de la guardia"
                onClick={alerta}
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

          <div className="col col-12 col-sm-6 col-lg-4 gx-4">
            <div className="card">
              <img
                src="../img/vecinosAlerta.png"
                height="0.5%"
                className="card-img-top"
                alt="imagen de los vecinos de la isla"
                onClick={ruidos}
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

          <div className="col col-12 col-sm-6 col-lg-4 gx-4">
            <div className="card">
              <img
                src="../img/911.png"
                height="0.5%"
                className="card-img-top"
                alt="imagen de la guardia"
                onClick={llamar911}
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


