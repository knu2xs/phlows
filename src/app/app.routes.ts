import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RiverDetailComponent } from './components/river-detail/river-detail.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'river/:id', component: RiverDetailComponent },
  { path: '**', redirectTo: '' }
];
