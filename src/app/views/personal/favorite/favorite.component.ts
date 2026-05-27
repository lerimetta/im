import { Component, OnInit } from '@angular/core';
import { CartService } from 'src/app/shared/services/cart.service';
import { FavoriteService } from 'src/app/shared/services/favorite.service';
import { environment } from 'src/environments/environment';
import { CartType } from 'src/types/cart.type';
import { DefaultResponseType } from 'src/types/default-response.type';
import { FavoriteType } from 'src/types/favorite.type';
import { map } from 'rxjs';

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss']
})
export class FavoriteComponent implements OnInit {
  products: FavoriteType[] = [];
  serverStaticPath = environment.serverStaticPath;
  cart: CartType | null = null;

  constructor(private favoriteService: FavoriteService, private cartService: CartService) { }

  ngOnInit(): void {
    this.cartService.getCart()
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.cart = data as CartType;
        this.favoriteService.getFavorites()
          .pipe(
            map(result => {
              let arr = (result as FavoriteType[]).map(item => {
                let itemInCart = this.cart!.items.find(el => el.product.id === item.id);
                if (itemInCart) {
                  item.quantity = itemInCart.quantity;
                  item.isInCart = true;
                }
                return item;
              })
              return arr;
            })
          )
          .subscribe((data: FavoriteType[] | DefaultResponseType) => {
            if ((data as DefaultResponseType).error !== undefined) {
              const error = (data as DefaultResponseType).message;
              throw new Error(error);
            }
            this.products = data as FavoriteType[];
          })
      })
  }

  getProductsWithQuantity() {
    let arr = this.products.map(item => {
      let itemInCart = this.cart!.items.find(el => el.product.id === item.id);
      if (itemInCart) {
        item.quantity = itemInCart.quantity;
        item.isInCart = true;
      }
      return item;
    });
    this.products = arr;
    return arr;
  }
  removeFromFavorites(id: string) {
    this.favoriteService.removeFavorite(id)
      .subscribe((data: DefaultResponseType) => {
        if (data.error) {
          throw new Error(data.message);
        } 
      })
    this.products = this.products.filter(item => item.id !== id)
  }

  updateCount(id: string, count: number | undefined) {
    const index = this.products.findIndex(item => item.id === id);
    this.products[index].quantity = count;
    let numberFromCount = count;
    if (this.products[index].isInCart && numberFromCount) {
      this.cartService.updateCart(id, numberFromCount)
        .subscribe((data: CartType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) {
            throw new Error((data as DefaultResponseType).message);
          }
        })
    }
  }

  addToCart(id: string) {
    const index = this.products.findIndex(item => item.id === id);
    let count = this.products[index].quantity;
    if (!count) {
      count = 1;
    }
    this.cartService.updateCart(id, count!)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.products[index].isInCart = true;
      });
  }

  removeFromCart(id: string) {
    this.cartService.updateCart(id, 0)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        const index = this.products.findIndex(item => item.id === id);
        this.products[index].quantity = 0;
        this.products[index].isInCart = false;
      })
  }
}
