namespace bookshop;

using { managed, cuid } from '@sap/cds/common';

entity Books : managed, cuid {
  title       : String(100) not null;
  author      : String(100);
  genre       : String(50);
  price       : Decimal(10,2);
  stock       : Integer default 0;
  description : String(500);
  publishedAt : Date;
}