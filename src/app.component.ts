import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class AppComponent {
  // --- Input Signals ---
  scubaVolumeL = signal(8);
  scubaPressureBar = signal(300);
  rifleVolumeCC = signal(300);
  rifleTargetPressureBar = signal(200);
  rifleMinPressureBar = signal(100);
  hoseLengthOption = signal<'100' | '50' | 'custom'>('100');
  hoseCustomLengthCm = signal(75);

  // --- Constants ---
  private readonly HOSE_INNER_RADIUS_CM = 0.1;

  // --- Computed Signals for Calculation ---
  hoseLengthCm = computed(() => {
    switch (this.hoseLengthOption()) {
      case '100': return 100;
      case '50': return 50;
      case 'custom': return this.hoseCustomLengthCm() || 0;
      default: return 100;
    }
  });

  hoseVolumeL = computed(() => {
    const length = this.hoseLengthCm();
    if (length <= 0) return 0;
    const volumeCm3 = Math.PI * Math.pow(this.HOSE_INNER_RADIUS_CM, 2) * length;
    return volumeCm3 / 1000;
  });

  numberOfRefills = computed(() => {
    const scubaV = this.scubaVolumeL() ?? 0;
    const scubaP = this.scubaPressureBar() ?? 0;
    const rifleV_L = (this.rifleVolumeCC() ?? 0) / 1000;
    const rifleTargetP = this.rifleTargetPressureBar() ?? 0;
    const rifleMinP = this.rifleMinPressureBar() ?? 0;
    const hoseV_L = this.hoseVolumeL();

    if (scubaV <= 0 || scubaP <= 0 || rifleV_L <= 0 || rifleTargetP <= 0 || rifleMinP < 0 || scubaP <= rifleTargetP || rifleTargetP <= rifleMinP) {
      return 0;
    }

    const totalAirScubaInitial = scubaV * scubaP;
    const totalAirScubaFinal = scubaV * rifleTargetP;
    const usableAirScuba = totalAirScubaInitial - totalAirScubaFinal;

    const pressureDeltaRifle = rifleTargetP - rifleMinP;
    const airNeededPerRifleFill = rifleV_L * pressureDeltaRifle;
    const airWastedPerFillInHose = hoseV_L * rifleTargetP;
    const totalAirPerFill = airNeededPerRifleFill + airWastedPerFillInHose;

    if (totalAirPerFill <= 0) return 0;

    return Math.floor(usableAirScuba / totalAirPerFill);
  });
}
