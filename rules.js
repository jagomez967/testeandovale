/*
 * El objeto rules define las reglas del juego de caramelos.
 * Las reglas son independientes del tablero y de la interfaz de usuario.
 * Las reglas son las siguientes:
 * - Un movimiento es válido si y sólo si elimina al menos un caramelo.
 * - Un caramelo se elimina si forma una línea de al menos tres caramelos del mismo color.
 * - Las líneas pueden ser horizontales o verticales.
 * - Los caramelos se mueven hacia abajo para llenar los espacios vacíos.
 * - Los nuevos caramelos se añaden en la parte superior para rellenar los espacios vacíos.
 */

var Rules = function (board) {
    // startup, para evitar sumar puntos por error al iniciar
    var scoring = false;

    /*
    * Prepara un nuevo juego. si encuentra un crush lo deshace sin sumar puntos
    */
    this.prepareNewGame = function () {

        scoring = false;
        while (true) {
            this.populateBoard()
            var crushable = this.getCandyCrushes();
            if (crushable.length == 0) break;
            this.removeCrushes(crushable);
        }
        scoring = true;
    }

    /*
     * Devuelve verdadero si el movimiento (caramelo, dirección) es válido.
     * Un movimiento es válido si comienza en un caramelo válido, se mueve a un vecino,
     * y la posición del caramelo después del movimiento formaría una línea de tres o más caramelos del mismo color.
     */
    this.isMoveTypeValid = function (fromCandy, direction) {
        return this.numberCandiesCrushedByMove(fromCandy, direction) > 0;
    }

    /*
    *  Devuelve los crushes en el tablero
    *  un crush es una lista de tres o más caramelos en una fila o columna que tienen el mismo color.
    *  se utiliza this.removeCrushes para eliminarlos del tablero.
    */
    this.getCandyCrushes = function (swap) {
        // Utilizo algoritmo de union-find (conjuntos disjuntos) para encontrar los crushes
        var unioned = {}; // la variable unioned guarda la información sobre las relaciones de unión entre los caramelos en el tablero, lo que permite encontrar los grupos de caramelos que forman un "crush".
        var sizes = {}; //la variable sizes se utiliza para realizar un seguimiento del tamaño de cada conjunto de caramelos en el tablero durante el proceso de encontrar los "crushes" (conjuntos de caramelos del mismo color que se eliminan).
        var row, col; //estas son obvias, no voy a explicar boludeces ahre
        function find(key) {
            var parent = unioned[key];
            if (parent == null) return key;
            parent = find(parent);
            unioned[key] = parent; // aplano la estructura de arbol, mirá el video que te pase por favor :(
            return parent;
        }
        // devuelve el tamaño del set, 1 si no se encuentra
        function size(found) {
            return sizes[found] || 1;
        }
        function union(key1, key2) {
            var p1 = find(key1), p2 = find(key2);
            if (p1 == p2) return p1;
            unioned[p2] = p1;
            sizes[p1] = size(p1) + size(p2);
            delete sizes[p2];
        }
        // consigo los colores x3 agrupados en filas y columnas
        var vert = this.findColorStrips(true, swap);
        var horiz = this.findColorStrips(false, swap);
        var sets = vert.concat(horiz);

        // union de los conjutos horizontales y verticales
        // en el caso de que sean los dos juntos, se intersectan (figuras T y L)
        for (var j = 0; j < sets.length; j++) {
            var set = sets[j];
            for (var k = 1; k < set.length; k++) {
                union(set[0].id, set[k].id)
            }
        }

        // Inicializa un objeto vacío 'results' para almacenar los grupos de caramelos que pueden ser eliminados.
        var results = {}
        //Recorre cada fila y columna del tablero.
        for (row = 0; row < board.boardSize; row++) {
            for (col = 0; col < board.boardSize; col++) {
                var candy = board.getCandyAt(row, col); //Caramelo en la posicion actual
                if (candy) {
                    var p = find(candy.id); //Encuentra el conjunto al que pertenece el caramelo
                    if (size(p) >= 3) { //Si el conjunto tiene 3 o más caramelos, agrega el caramelo al conjunto de resultados.
                        if (!(p in results)) results[p] = []; //Si el conjunto no está en los resultados, lo agrega.
                        results[p].push(candy); //Agrega el caramelo al conjunto de resultados.
                    }
                }
            }
        }
        //Esto es facil, no hace falta explicar mucho.
        var list = [];
        for (var key in results) {
            list.push(results[key]);
        }
        return list;
    }

    /*
    * Esta función se utiliza para eliminar los grupos de caramelos que pueden ser eliminados ("crushes") del tablero.
    * @param {Array} setOfSetsOfCrushes - Un array de arrays, donde cada subarray es un grupo de caramelos que pueden ser eliminados.
    * La función recorre cada grupo de caramelos en setOfSetsOfCrushes. Para cada caramelo en el grupo, si el juego está en modo de puntuación (indicado por la variable 'scoring'), incrementa la puntuación del jugador en función de la posición del caramelo en el tablero. Luego, elimina el caramelo del tablero.
    * Nota: Esta función no mueve los caramelos hacia abajo para llenar los espacios vacíos después de eliminar los caramelos. Esa operación debe ser realizada por otra función después de llamar a esta.
    */
    this.removeCrushes = function (setOfSetsOfCrushes) {
        for (var j = 0; j < setOfSetsOfCrushes.length; j++) {
            var set = setOfSetsOfCrushes[j];
            for (var k = 0; k < set.length; k++) {
                if (scoring) board.incrementScore(set[k], set[k].row, set[k].col);
                board.remove(set[k]);
            }
        }
    }

    /*
    * esta si mueve los caramelos abajo, tambien llena los espacios vacíos con caramelos random
    */
    this.moveCandiesDown = function () {
        // Collapse each column
        for (var col = 0; col < board.boardSize; col++) {
            var emptyRow = null;
            // In each column, scan for the bottom most empty row
            for (var emptyRow = board.boardSize - 1; emptyRow >= 0; emptyRow--) {
                if (board.getCandyAt(emptyRow, col) == null) {
                    break;
                }
            }
            // Then shift any nonempty rows up
            for (var row = emptyRow - 1; row >= 0; row--) {
                var candy = board.getCandyAt(row, col);
                if (candy != null) {
                    board.moveTo(candy, emptyRow, col);
                    emptyRow--;
                }
            }

            for (var spawnRow = -1; emptyRow >= 0; emptyRow--, spawnRow--) {
                // We report spawnRow as the (negative) position where
                // the candy "would have" started to fall into place.
                board.addRandomCandy(emptyRow, col, spawnRow, col);
            }

        }
    }
   

    /*
    * Lleno el tablero al inicializar el juego
    */
    this.populateBoard = function () {
        for (var col = 0; col < board.boardSize; col++) {
            for (var row = 0; row < board.boardSize; row++) {
                // si la posciion está vacia, coloco un candy Random
                if (board.getCandyAt(row, col) == null) {
                    board.addRandomCandy(row, col);
                }
            }
        }
    }


    /*
    *
    *  Helper method for rules.isMoveTypeValid
    *  Returns the number of candies that would be crushed if the candy
    *  provided by fromCandy were to be flipped in the direction
    *  specified (['up', 'down', 'left', 'right'])
    * 
    *  If this move is not valid (based on the game rules), then 0 is returned
    * 
    */
    this.numberCandiesCrushedByMove = function (fromCandy, direction) {
        return this.getCandiesToCrushGivenMove(fromCandy, direction).length;
    }

    /*
    *
    *  Helper method for rules.numberCandiesCrushedByMove
    *  Returns a list of candies that would be "crushed" (i.e. removed) if
    *  fromCandy were to be moved in the direction specified by direction (['up',
    *  'down', 'left', 'right'])
    *  If move would result in no crushed candies, an empty list is returned.
    *
    */
    this.getCandiesToCrushGivenMove = function (fromCandy, direction) {
        var toCandy = board.getCandyInDirection(fromCandy, direction);
        if (!toCandy || toCandy.color == fromCandy.color) {
            return [];
        }
        var swap = [fromCandy, toCandy];
        var crushable = this.getCandyCrushes(swap);
        // Only return crushable groups that involve the swapped candies.
        // If the board has incompletely-resolved crushes, there can be
        // many crushable candies that are not touching the swapped ones.
        var connected = crushable.filter(function (set) {
            for (var k = 0; k < swap.length; k++) {
                if (set.indexOf(swap[k]) >= 0) return true;
            }
            return false;
        });

        return [].concat.apply([], connected); //flatten nested lists
    }


    /*
    *
    *  Helper Method for rules.getCandyCrushes
    *  Returns a set of sets of all the same-color candy strips of length
    *  at least 3 on the board.  If 'vertical' is set to true, looks only for
    *  vertical strips; otherwise only horizontal ones. If the 'swap' array
    *  is passed, then every even-indexed candy in the array is considered
    *  swapped with every odd-indexed candy in the array.
    *
    */
    this.findColorStrips = function (vertical, swap) {
        var getAt = function (x, y) {
            // Retrieve the candy at a row and column (depending on vertical)
            var result = vertical ? board.getCandyAt(y, x) : board.getCandyAt(x, y);
            if (swap) {
                // If the result candy is in the 'swap' array, then swap the
                // result with its adjacent pair.
                var index = swap.indexOf(result);
                if (index >= 0) return swap[index ^ 1];
            }
            return result;
        };
        var result = [];
        for (var j = 0; j < board.boardSize; j++) {
            for (var h, k = 0; k < board.boardSize; k = h) {
                // Scan for rows of same-colored candy starting at k
                var firstCandy = getAt(j, k);
                h = k + 1;
                if (!firstCandy) continue;
                var candies = [firstCandy];
                for (; h < board.boardSize; h++) {
                    var lastCandy = getAt(j, h);
                    if (!lastCandy || lastCandy.color != firstCandy.color) break;
                    candies.push(lastCandy);
                }
                // If there are at least 3 candies in a row, remember the set.
                if (candies.length >= 3) result.push(candies);
            }
        }
        return result;
    }
}
