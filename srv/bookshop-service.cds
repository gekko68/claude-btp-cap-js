using { bookshop as db } from '../db/schema';

service BookshopService @(path: '/bookshop') {
  
  entity Books as projection on db.Books;
  
  action createBook(title: String, author: String, genre: String, price: Decimal, stock: Integer) returns Books;
  
  function getBooksByGenre(genre: String) returns array of Books;
}