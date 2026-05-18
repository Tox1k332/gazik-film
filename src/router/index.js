import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Catalog from '../views/Catalog.vue'
import MoviePage from '../views/MoviePage.vue'
import Discussions from '../views/Discussions.vue'
import Auth from '../views/Auth.vue'
import Profile from '../views/Profile.vue'
import DiscussionTopic from '../views/DiscussionTopic.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/catalog',
    name: 'Catalog',
    component: Catalog,
    props: route => ({ type: route.query.type || 'movie' })
  },
  {
    path: '/movies',
    redirect: { name: 'Catalog', query: { type: 'movie' } }
  },
  {
    path: '/cartoons',
    redirect: { name: 'Catalog', query: { type: 'cartoon' } }
  },
  {
    path: '/tv',
    redirect: { name: 'Catalog', query: { type: 'tv' } }
  },
  {
    path: '/anime',
    redirect: { name: 'Catalog', query: { type: 'anime' } }
  },
  {
    path: '/movie/:id',
    name: 'Movie',
    component: MoviePage,
    props: true
  },
  {
    path: '/cartoon/:id',
    name: 'Cartoon',
    component: MoviePage,
    props: true
  },
  {
    path: '/tv/:id',
    name: 'TVShow',
    component: MoviePage,
    props: true
  },
  {
    path: '/anime/:id',
    name: 'Anime',
    component: MoviePage,
    props: true
  },
  {
    path: '/discussions',
    name: 'Discussions',
    component: Discussions
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/discussions/:id',
    name: 'DiscussionTopic',
    component: DiscussionTopic,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router