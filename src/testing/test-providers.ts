import {
  EnvironmentProviders,
  Provider,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { MockControl } from './../app/data-access/mock/mock-control.service';
import { provideMockRepositories } from './../app/data-access/mock/provide-mock-repositories';

/** Mock repositories with zero latency, so tests are deterministic and need no timers. */
export function provideInstantMocks(): (Provider | EnvironmentProviders)[] {
  return [
    provideMockRepositories(),
    provideNativeDateAdapter(),
    provideRouter([]),
    provideEnvironmentInitializer(() => inject(MockControl).latencyMs.set(0)),
  ];
}
