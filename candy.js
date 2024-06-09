 /**
 * Este objeto representa un Candy, un Candy tiene un color, una columna y una fila.
 */

var Candy = function(color, id)
{
 Object.defineProperty(this, 'color', {value: color, writable: false});
 Object.defineProperty(this, 'id', {value: id, writable: false});

 this.row = null;
 this.col = null;
 this.toString = () => this.color;

};

Candy.colors = [
  'caminoSinuoso',
  'autopistaComienzo',
  'dobleMano',
  'estacionServicio',
  'prohibidoDoblarIzq',
  'rutaNacional'
];
