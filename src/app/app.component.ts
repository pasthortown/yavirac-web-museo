import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { Component, ViewChild } from '@angular/core';
import { Articulo } from './../entidades/Articulo';
import { Adjunto } from './../entidades/Adjunto';
import { Http } from '@angular/http';
import * as jsPDF from 'jspdf';
import * as html2canvas from 'html2canvas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  @ViewChild('fileInput') fileInput;
  @ViewChild('ficha') ficha;
  title = 'app';
  articulo: Articulo;
  adjunto: Adjunto;
  articulos: Articulo[];
  fotografia = null;
  idArticuloSeleccionado: number;
  webServiceURL = 'http://qrstore.000webhostapp.com/QRStore/';

  constructor(public http: Http) {
  }

  ngOnInit() {
    this.articulo = new Articulo();
    this.adjunto = new Adjunto();
    this.getArticulos();
    this.idArticuloSeleccionado = 0;
  }

  getArticulos() {
    this.articulos = [];
    this.http.get(this.webServiceURL + 'articulo/leer')
    .subscribe(respuesta => {
      if (respuesta.json() == '0') {
        return;
      }
      this.articulos = respuesta.json();
    }, error => {
      console.log(error);
    });
  }

  articuloSeleccionado() {
    if (this.idArticuloSeleccionado == 0 ) {
      this.articulo = new Articulo();
      this.adjunto = new Adjunto();
      this.fotografia = null;
      this.articulo.titulo = '';
      return;
    }
    this.http.get(this.webServiceURL + 'articulo/leer?id=' + this.idArticuloSeleccionado.toString())
    .subscribe(respuesta => {
      this.articulo = respuesta.json()[0];
      this.http.get(this.webServiceURL + 'adjunto/leer?id='+this.articulo.idAdjunto.toString())
      .subscribe(respuestaAdjunto => {
        this.adjunto = respuestaAdjunto.json()[0];
        this.fotografia = 'data:' + this.adjunto.tipoArchivo + ';base64,' + this.adjunto.archivo;
      }, error => {
        console.log(error);
      });
    }, error => {
      console.log(error);
    });
  }

  nuevo() {
    this.getArticulos();
    this.articulo = new Articulo();
    this.adjunto = new Adjunto();
    this.fotografia = null;
    this.articulo.titulo = '';
    this.idArticuloSeleccionado = 0;
  }

  cancelar() {
    if (this.idArticuloSeleccionado == 0) {
      this.nuevo();
      return;
    }
    this.articuloSeleccionado();
  }

  borrar() {
    if (this.idArticuloSeleccionado == 0) {
      return;
    }
    this.http.get(this.webServiceURL + 'adjunto/borrar?id=' + this.adjunto.id.toString())
    .subscribe(respuestaAdjunto => {
      this.http.get(this.webServiceURL + 'articulo/borrar?id=' + this.articulo.id.toString())
      .subscribe(respuesta => {
        this.nuevo();
        alert('Articulo Borrado');
        return;
      }, error => {
        console.log(error);
      });
    }, error => {
      console.log(error);
    });
  }

  guardar() {
    if (this.adjunto.nombreArchivo == null) {
      alert('Ingrese una fotografía');
      return;
    }
    if (this.idArticuloSeleccionado == 0) {
      this.http.post(this.webServiceURL + 'adjunto/crear', JSON.stringify(this.adjunto))
      .subscribe(r => {
        this.http.get(this.webServiceURL + 'adjunto/leer_filtrado?columna=nombreArchivo&tipo_filtro=coincide&filtro='+r.json())
        .subscribe(respuestaAdjunto => {
          const adjuntoCreado = respuestaAdjunto.json()[0] as Adjunto;
          this.articulo.idAdjunto = adjuntoCreado.id;
          this.http.post(this.webServiceURL + 'articulo/crear', JSON.stringify(this.articulo))
          .subscribe(respuestaArticulo => {
            alert('Articulo Guardado');
            this.nuevo();
            return;
          }, error => {
            console.log(error);
          });
        }, error => {
          console.log(error);
        });
      }, error => {
        console.log(error);
      });
    }else {
      this.http.post(this.webServiceURL + 'adjunto/actualizar', JSON.stringify(this.adjunto))
      .subscribe(r => {
        this.http.post(this.webServiceURL + 'articulo/actualizar', JSON.stringify(this.articulo))
        .subscribe(respuesta => {
          alert('Articulo Actualizado');
          this.nuevo();
          return;
        }, error => {
          console.log(error);
        });
      }, error => {
        console.log(error);
      });
    }
  }

  subirPicture() {
    this.fileInput.nativeElement.click();
  }

  subirImagen(event) {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        reader.readAsDataURL(file);
        reader.onload = () => {
          this.adjunto.nombreArchivo = file.name;
          this.adjunto.tipoArchivo = file.type;
          this.adjunto.archivo = reader.result.split(',')[1];
          this.fotografia = 'data:' + this.adjunto.tipoArchivo + ';base64,' + this.adjunto.archivo;
        };
    }
  }

  imprimir() {
    html2canvas(this.ficha.nativeElement).then(canvasFicha => {
      const ficha = canvasFicha.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.addImage(ficha, 'PNG', 20, 20);
      doc.save('Ficha' + this.articulo.titulo + '.pdf');
    });
  }
}
